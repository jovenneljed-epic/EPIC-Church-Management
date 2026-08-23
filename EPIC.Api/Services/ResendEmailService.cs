using Resend;

namespace EPIC.Api.Services
{
    public class ResendEmailService
    {
        private readonly IResend _resend;

        private readonly IConfiguration _configuration;

        public ResendEmailService(
            IResend resend,
            IConfiguration configuration)
        {
            _resend = resend;
            _configuration = configuration;
        }

        // =====================================================
        // SEND DEMO REQUEST CONFIRMATION
        // =====================================================

        public async Task SendDemoRequestConfirmationAsync(
            string fullName,
            string email,
            string churchName)
        {
            try
            {
                var fromEmail =
                    _configuration["Resend:FromEmail"];

                if (string.IsNullOrWhiteSpace(fromEmail))
                {
                    throw new InvalidOperationException(
                        "Resend FromEmail is not configured.");
                }

                var message =
                    new EmailMessage();

                message.From =
                    fromEmail;

                message.To.Add(
                    email);

                message.Subject =
                    "We received your EPIC Demo Request!";

                message.HtmlBody =
                    $@"
                    <!DOCTYPE html>
                    <html>
                    <body style=""
                        font-family: Arial, sans-serif;
                        background-color: #f5f7fb;
                        padding: 30px;
                    "">

                        <div style=""
                            max-width: 600px;
                            margin: auto;
                            background: white;
                            padding: 35px;
                            border-radius: 12px;
                        "">

                            <h1 style=""
                                color: #1e3a8a;
                            "">
                                EPIC
                            </h1>

                            <h2>
                                Hello {fullName}!
                            </h2>

                            <p>
                                Thank you for your interest in
                                <strong>
                                    EPIC Church Management System
                                </strong>.
                            </p>

                            <p>
                                We have successfully received
                                your demo request for:
                            </p>

                            <div style=""
                                background: #f1f5f9;
                                padding: 15px;
                                border-radius: 8px;
                            "">

                                <strong>
                                    Church / Organization:
                                </strong>

                                <br />

                                {churchName}

                            </div>

                            <p>
                                Our EPIC team will review your
                                request and contact you soon to
                                discuss your personalized system
                                demonstration.
                            </p>

                            <p>
                                We are excited to show you how
                                EPIC can help your church manage
                                people, ministries, attendance,
                                giving, discipleship, learning,
                                and more.
                            </p>

                            <br />

                            <p>
                                God bless,
                            </p>

                            <p>
                                <strong>
                                    EPIC Team
                                </strong>

                                <br />

                                Engaging People Into Christ
                            </p>

                        </div>

                    </body>
                    </html>";

                await _resend.EmailSendAsync(
                    message);
            }
            catch (Exception ex)
            {
                Console.WriteLine(
                    "Failed to send demo confirmation email:");

                Console.WriteLine(
                    ex.Message);

                // Do not throw here.
                // The demo request should still succeed
                // even if email delivery temporarily fails.
            }
        }
    }
}