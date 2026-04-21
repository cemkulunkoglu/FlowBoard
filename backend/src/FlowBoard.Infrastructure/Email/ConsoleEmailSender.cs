using FlowBoard.Application.Abstractions;
using Microsoft.Extensions.Logging;

namespace FlowBoard.Infrastructure.Email;

public class ConsoleEmailSender : IEmailSender
{
    private readonly ILogger<ConsoleEmailSender> _logger;

    public ConsoleEmailSender(ILogger<ConsoleEmailSender> logger) => _logger = logger;

    public Task SendAsync(string to, string subject, string body, CancellationToken ct = default)
    {
        _logger.LogInformation(
            "[ConsoleEmail] To: {To} · Subject: {Subject}\n{Body}",
            to, subject, body);
        return Task.CompletedTask;
    }
}
