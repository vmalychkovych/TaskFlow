using System.Diagnostics;
using System.Net.Http;
using System.Net.NetworkInformation;

var repoRoot = FindRepoRoot();
var dockerComposePath = Path.Combine(repoRoot, "docker-compose.yml");
var backendDirectory = Path.Combine(repoRoot, "TaskFlow.WebAPI");
var backendBuildOutputDirectory = Path.Combine(
    backendDirectory,
    "bin",
    "Debug",
    "net8.0");
var backendExecutablePath = Path.Combine(
    backendBuildOutputDirectory,
    "TaskFlow.WebAPI.exe");
var backendRuntimeDirectory = Path.Combine(repoRoot, ".dev-runtime", "backend");
var frontendDirectory = Path.Combine(repoRoot, "TaskFlow.Frontend");
var frontendUrl = "http://127.0.0.1:3000";
var backendUrl = "http://localhost:5240/swagger";

using var shutdown = new CancellationTokenSource();
Process? backendProcess = null;
Process? frontendProcess = null;

Console.CancelKeyPress += (_, eventArgs) =>
{
    eventArgs.Cancel = true;
    SafeCancel(shutdown);
};

AppDomain.CurrentDomain.ProcessExit += (_, _) =>
{
    SafeCancel(shutdown);
};

try
{
    await TryStartInfrastructureAsync(dockerComposePath, repoRoot, shutdown.Token);

    var backendAlreadyRunning = await IsServiceAlreadyRunningAsync(
        "backend",
        5240,
        backendUrl,
        shutdown.Token);

    if (!backendAlreadyRunning)
    {
        EnsureFileExists(
            backendExecutablePath,
            "Build the solution once so TaskFlow.WebAPI.exe exists before launching from Visual Studio.");

        PrepareBackendRuntime(backendBuildOutputDirectory, backendRuntimeDirectory);

        backendProcess = StartBackend(
            Path.Combine(backendRuntimeDirectory, "TaskFlow.WebAPI.exe"),
            backendRuntimeDirectory);
        AttachLogs(backendProcess, "[backend]");
    }

    var frontendAlreadyRunning = await IsServiceAlreadyRunningAsync(
        "frontend",
        3000,
        frontendUrl,
        shutdown.Token);

    if (!frontendAlreadyRunning)
    {
        EnsureFileExists(
            Path.Combine(frontendDirectory, "package.json"),
            "TaskFlow.Frontend\\package.json is missing.");

        await EnsureFrontendDependenciesAsync(frontendDirectory, shutdown.Token);

        frontendProcess = StartFrontend(frontendDirectory);
        AttachLogs(frontendProcess, "[frontend]");
    }

    await WaitForUrlAsync(backendUrl, TimeSpan.FromSeconds(90), shutdown.Token);
    await WaitForUrlAsync(frontendUrl, TimeSpan.FromSeconds(90), shutdown.Token);

    OpenBrowser(frontendUrl);

    Console.WriteLine();
    Console.WriteLine("TaskFlow is ready.");
    Console.WriteLine($"Frontend: {frontendUrl}");
    Console.WriteLine($"Backend:  {backendUrl}");
    Console.WriteLine("Stop debugging or close this window to shut everything down.");

    await WaitForShutdownAsync(backendProcess, frontendProcess, shutdown.Token);
}
catch (OperationCanceledException)
{
    Console.WriteLine("Launcher cancelled.");
}
catch (Exception exception)
{
    Console.Error.WriteLine(exception.Message);
    Environment.ExitCode = 1;
}
finally
{
    KillProcessTree(frontendProcess);
    KillProcessTree(backendProcess);
}

static string FindRepoRoot()
{
    var directory = new DirectoryInfo(AppContext.BaseDirectory);

    while (directory != null)
    {
        if (File.Exists(Path.Combine(directory.FullName, "TaskFlow.sln")))
        {
            return directory.FullName;
        }

        directory = directory.Parent;
    }

    throw new InvalidOperationException("Unable to locate TaskFlow.sln from the launcher output directory.");
}

static async Task<bool> IsServiceAlreadyRunningAsync(
    string serviceName,
    int port,
    string healthUrl,
    CancellationToken cancellationToken)
{
    if (!IsPortInUse(port))
    {
        return false;
    }

    Console.WriteLine($"{serviceName} is already using port {port}. Checking whether it can be reused...");

    if (await CanReachUrlAsync(healthUrl, cancellationToken))
    {
        Console.WriteLine($"Reusing the existing {serviceName}.");
        return true;
    }

    throw new InvalidOperationException(
        $"Port {port} is already in use, but the {serviceName} did not respond at {healthUrl}. Stop the conflicting process and run the launcher again.");
}

static bool IsPortInUse(int port)
{
    var properties = IPGlobalProperties.GetIPGlobalProperties();
    var listeners = properties.GetActiveTcpListeners();
    return listeners.Any(listener => listener.Port == port);
}

static async Task TryStartInfrastructureAsync(string dockerComposePath, string workingDirectory, CancellationToken cancellationToken)
{
    if (!File.Exists(dockerComposePath))
    {
        return;
    }

    Console.WriteLine("Ensuring Docker dependencies are running...");

    var exitCode = await RunCommandAsync(
        "docker",
        "compose up -d",
        workingDirectory,
        cancellationToken);

    if (exitCode == 0)
    {
        return;
    }

    Console.WriteLine("Docker compose did not complete successfully. Continuing in case the dependencies are already running.");
}

static void EnsureFileExists(string path, string message)
{
    if (!File.Exists(path))
    {
        throw new FileNotFoundException(message, path);
    }
}

static async Task EnsureFrontendDependenciesAsync(string frontendDirectory, CancellationToken cancellationToken)
{
    if (Directory.Exists(Path.Combine(frontendDirectory, "node_modules")))
    {
        return;
    }

    Console.WriteLine("Installing frontend dependencies...");

    var exitCode = await RunCommandAsync(
        "cmd.exe",
        "/c npm install",
        frontendDirectory,
        cancellationToken);

    if (exitCode != 0)
    {
        throw new InvalidOperationException("npm install failed. Make sure Node.js and npm are installed and available in PATH.");
    }
}

static void PrepareBackendRuntime(string sourceDirectory, string runtimeDirectory)
{
    if (!Directory.Exists(sourceDirectory))
    {
        throw new DirectoryNotFoundException($"Backend build output folder was not found: {sourceDirectory}");
    }

    if (Directory.Exists(runtimeDirectory))
    {
        Directory.Delete(runtimeDirectory, recursive: true);
    }

    CopyDirectory(sourceDirectory, runtimeDirectory);
}

static void CopyDirectory(string sourceDirectory, string destinationDirectory)
{
    Directory.CreateDirectory(destinationDirectory);

    foreach (var filePath in Directory.GetFiles(sourceDirectory))
    {
        var fileName = Path.GetFileName(filePath);
        File.Copy(filePath, Path.Combine(destinationDirectory, fileName), overwrite: true);
    }

    foreach (var childDirectory in Directory.GetDirectories(sourceDirectory))
    {
        var childDirectoryName = Path.GetFileName(childDirectory);
        CopyDirectory(
            childDirectory,
            Path.Combine(destinationDirectory, childDirectoryName));
    }
}

static Process StartBackend(string executablePath, string workingDirectory)
{
    Console.WriteLine("Starting backend...");

    var startInfo = new ProcessStartInfo
    {
        FileName = executablePath,
        Arguments = "--urls http://localhost:5240",
        WorkingDirectory = workingDirectory,
        UseShellExecute = false,
        RedirectStandardOutput = true,
        RedirectStandardError = true,
    };

    startInfo.Environment["ASPNETCORE_ENVIRONMENT"] = "Development";
    startInfo.Environment["DOTNET_ENVIRONMENT"] = "Development";

    return Process.Start(startInfo)
           ?? throw new InvalidOperationException("Failed to start the backend process.");
}

static Process StartFrontend(string frontendDirectory)
{
    Console.WriteLine("Starting frontend...");

    var startInfo = new ProcessStartInfo
    {
        FileName = "cmd.exe",
        Arguments = "/c npm run dev -- --hostname 127.0.0.1 --port 3000",
        WorkingDirectory = frontendDirectory,
        UseShellExecute = false,
        RedirectStandardOutput = true,
        RedirectStandardError = true,
    };

    startInfo.Environment["NEXT_PUBLIC_API_URL"] = "http://localhost:5240/api";

    return Process.Start(startInfo)
           ?? throw new InvalidOperationException("Failed to start the frontend process.");
}

static void AttachLogs(Process process, string prefix)
{
    process.OutputDataReceived += (_, eventArgs) =>
    {
        if (!string.IsNullOrWhiteSpace(eventArgs.Data))
        {
            Console.WriteLine($"{prefix} {eventArgs.Data}");
        }
    };

    process.ErrorDataReceived += (_, eventArgs) =>
    {
        if (!string.IsNullOrWhiteSpace(eventArgs.Data))
        {
            Console.WriteLine($"{prefix} {eventArgs.Data}");
        }
    };

    process.BeginOutputReadLine();
    process.BeginErrorReadLine();
}

static async Task WaitForUrlAsync(string url, TimeSpan timeout, CancellationToken cancellationToken)
{
    var startedAt = DateTime.UtcNow;

    while (DateTime.UtcNow - startedAt < timeout)
    {
        cancellationToken.ThrowIfCancellationRequested();

        if (await CanReachUrlAsync(url, cancellationToken))
        {
            return;
        }

        await Task.Delay(1000, cancellationToken);
    }

    throw new TimeoutException($"Timed out waiting for {url}.");
}

static void OpenBrowser(string url)
{
    Process.Start(new ProcessStartInfo
    {
        FileName = url,
        UseShellExecute = true,
    });
}

static async Task WaitForShutdownAsync(Process? backendProcess, Process? frontendProcess, CancellationToken cancellationToken)
{
    var processTasks = new List<Task>();

    if (backendProcess != null)
    {
        processTasks.Add(backendProcess.WaitForExitAsync(cancellationToken));
    }

    if (frontendProcess != null)
    {
        processTasks.Add(frontendProcess.WaitForExitAsync(cancellationToken));
    }

    var cancelTask = Task.Delay(Timeout.InfiniteTimeSpan, cancellationToken);
    processTasks.Add(cancelTask);

    var completedTask = await Task.WhenAny(processTasks);

    if (completedTask == cancelTask)
    {
        return;
    }

    if (backendProcess?.HasExited == true)
    {
        throw new InvalidOperationException($"Backend exited unexpectedly with code {backendProcess.ExitCode}.");
    }

    if (frontendProcess?.HasExited == true)
    {
        throw new InvalidOperationException($"Frontend exited unexpectedly with code {frontendProcess.ExitCode}.");
    }
}

static async Task<bool> CanReachUrlAsync(string url, CancellationToken cancellationToken)
{
    using var httpClient = new HttpClient
    {
        Timeout = TimeSpan.FromSeconds(5)
    };

    try
    {
        using var response = await httpClient.GetAsync(url, cancellationToken);
        return (int)response.StatusCode < 500;
    }
    catch
    {
        return false;
    }
}

static async Task<int> RunCommandAsync(
    string fileName,
    string arguments,
    string workingDirectory,
    CancellationToken cancellationToken)
{
    var startInfo = new ProcessStartInfo
    {
        FileName = fileName,
        Arguments = arguments,
        WorkingDirectory = workingDirectory,
        UseShellExecute = false,
        RedirectStandardOutput = true,
        RedirectStandardError = true,
    };

    using var process = Process.Start(startInfo)
                         ?? throw new InvalidOperationException($"Failed to start process: {fileName} {arguments}");

    process.OutputDataReceived += (_, eventArgs) =>
    {
        if (!string.IsNullOrWhiteSpace(eventArgs.Data))
        {
            Console.WriteLine($"[launcher] {eventArgs.Data}");
        }
    };

    process.ErrorDataReceived += (_, eventArgs) =>
    {
        if (!string.IsNullOrWhiteSpace(eventArgs.Data))
        {
            Console.WriteLine($"[launcher] {eventArgs.Data}");
        }
    };

    process.BeginOutputReadLine();
    process.BeginErrorReadLine();

    await process.WaitForExitAsync(cancellationToken);
    return process.ExitCode;
}

static void KillProcessTree(Process? process)
{
    if (process == null)
    {
        return;
    }

    try
    {
        if (!process.HasExited)
        {
            process.Kill(true);
            process.WaitForExit(5000);
        }
    }
    catch
    {
        // Best-effort cleanup.
    }
}

static void SafeCancel(CancellationTokenSource cancellationTokenSource)
{
    try
    {
        if (!cancellationTokenSource.IsCancellationRequested)
        {
            cancellationTokenSource.Cancel();
        }
    }
    catch (ObjectDisposedException)
    {
        // The launcher is already winding down.
    }
}
