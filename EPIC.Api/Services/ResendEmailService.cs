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
        // COMMON EMAIL SENDER
        // =====================================================

        private async Task SendEmailAsync(
            string recipientEmail,
            string subject,
            string htmlBody)
        {
            var fromEmail = _configuration["Resend:FromEmail"];

            if (string.IsNullOrWhiteSpace(fromEmail))
            {
                throw new InvalidOperationException(
                    "Resend FromEmail is not configured.");
            }

            if (string.IsNullOrWhiteSpace(recipientEmail))
            {
                throw new ArgumentException(
                    "Recipient email is required.",
                    nameof(recipientEmail));
            }

            var message = new EmailMessage
            {
                From = fromEmail,
                Subject = subject,
                HtmlBody = htmlBody
            };

            message.To.Add(recipientEmail);

            await _resend.EmailSendAsync(message);
        }


        // =====================================================
        // SEND DEMO REQUEST CONFIRMATION TO REQUESTER
        // =====================================================

        public async Task SendDemoRequestConfirmationAsync(
            string fullName,
            string email,
            string churchName)
        {
            try
            {
                var html = $@"
<!DOCTYPE html>
<html>
<body style='
    margin: 0;
    padding: 30px;
    background-color: #f5f7fb;
    font-family: Arial, sans-serif;
'>

<div style='
    max-width: 600px;
    margin: auto;
    background: white;
    padding: 35px;
    border-radius: 12px;
'>

    <h1 style='color: #1e3a8a;'>
        EPIC
    </h1>

    <h2>
        Hello {fullName}!
    </h2>

    <p>
        Thank you for your interest in
        <strong>EPIC Church Management System</strong>.
    </p>

    <p>
        We have successfully received your demo request for:
    </p>

    <div style='
        background: #f1f5f9;
        padding: 15px;
        border-radius: 8px;
    '>
        <strong>Church / Organization:</strong>
        <br />
        {churchName}
    </div>

    <p>
        Our EPIC team will review your request and contact you soon
        to discuss your personalized system demonstration.
    </p>

    <p>
        We are excited to show you how EPIC can help your church
        manage people, ministries, attendance, giving,
        discipleship, learning, and more.
    </p>

    <br />

    <p>God bless,</p>

    <p>
        <strong>EPIC Team</strong>
        <br />
        Engaging People Into Christ
    </p>

</div>

</body>
</html>";

                await SendEmailAsync(
                    email,
                    "We received your EPIC Demo Request!",
                    html);
            }
            catch (Exception ex)
            {
                Console.WriteLine(
                    "Failed to send demo confirmation email:");

                Console.WriteLine(ex.Message);

                // Email failure must not prevent
                // the demo request from being saved.
            }
        }


        // =====================================================
        // SEND NEW DEMO REQUEST NOTIFICATION TO ADMIN
        // =====================================================

        public async Task SendNewDemoRequestAdminNotificationAsync(
            string fullName,
            string email,
            string churchName,
            string? phone,
            string? position,
            string? messageText,
            int demoRequestId)
        {
            try
            {
                var adminEmail =
                    _configuration["Resend:AdminEmail"];

                if (string.IsNullOrWhiteSpace(adminEmail))
                {
                    throw new InvalidOperationException(
                        "Resend AdminEmail is not configured.");
                }

                var safePhone =
                    string.IsNullOrWhiteSpace(phone)
                        ? "Not provided"
                        : phone;

                var safePosition =
                    string.IsNullOrWhiteSpace(position)
                        ? "Not provided"
                        : position;

                var safeMessage =
                    string.IsNullOrWhiteSpace(messageText)
                        ? "No message provided."
                        : messageText;

                var html = $@"
<!DOCTYPE html>
<html>

<body style='
    margin: 0;
    padding: 30px;
    background-color: #f5f7fb;
    font-family: Arial, sans-serif;
'>

<div style='
    max-width: 650px;
    margin: auto;
    background: #ffffff;
    border-radius: 14px;
    overflow: hidden;
    box-shadow: 0 4px 15px rgba(0,0,0,0.08);
'>

    <div style='
        background-color: #1e3a8a;
        color: white;
        padding: 25px 30px;
    '>

        <h1 style='
            margin: 0;
            font-size: 26px;
        '>
            🔔 New Demo Request
        </h1>

        <p style='
            margin: 8px 0 0 0;
            opacity: 0.9;
        '>
            EPIC Church Management System
        </p>

    </div>

    <div style='padding: 30px;'>

        <h2 style='color: #1e3a8a;'>
            A new demo request has been received.
        </h2>

        <table style='
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
        '>

            <tr>
                <td style='
                    padding: 10px;
                    font-weight: bold;
                    background: #f8fafc;
                '>
                    Request ID
                </td>

                <td style='padding: 10px;'>
                    #{demoRequestId}
                </td>
            </tr>

            <tr>
                <td style='
                    padding: 10px;
                    font-weight: bold;
                    background: #f8fafc;
                '>
                    Full Name
                </td>

                <td style='padding: 10px;'>
                    {fullName}
                </td>
            </tr>

            <tr>
                <td style='
                    padding: 10px;
                    font-weight: bold;
                    background: #f8fafc;
                '>
                    Church / Organization
                </td>

                <td style='padding: 10px;'>
                    {churchName}
                </td>
            </tr>

            <tr>
                <td style='
                    padding: 10px;
                    font-weight: bold;
                    background: #f8fafc;
                '>
                    Email
                </td>

                <td style='padding: 10px;'>
                    {email}
                </td>
            </tr>

            <tr>
                <td style='
                    padding: 10px;
                    font-weight: bold;
                    background: #f8fafc;
                '>
                    Phone
                </td>

                <td style='padding: 10px;'>
                    {safePhone}
                </td>
            </tr>

            <tr>
                <td style='
                    padding: 10px;
                    font-weight: bold;
                    background: #f8fafc;
                '>
                    Position
                </td>

                <td style='padding: 10px;'>
                    {safePosition}
                </td>
            </tr>

        </table>

        <div style='
            margin-top: 25px;
            padding: 20px;
            background: #f1f5f9;
            border-radius: 10px;
        '>

            <strong>Message</strong>

            <p style='
                margin-bottom: 0;
                white-space: pre-wrap;
            '>
                {safeMessage}
            </p>

        </div>

        <div style='
            margin-top: 30px;
            padding: 15px;
            background: #fef3c7;
            border-radius: 8px;
            color: #92400e;
        '>

            <strong>Status:</strong>
            Pending

        </div>

        <p style='margin-top: 30px;'>
            Please open the
            <strong>EPIC Demo Requests</strong>
            module to review and process this request.
        </p>

        <hr style='
            border: 0;
            border-top: 1px solid #e5e7eb;
            margin: 30px 0;
        '>

        <p style='
            color: #64748b;
            font-size: 13px;
        '>
            This is an automatic notification generated by the
            EPIC Church Management System.
        </p>

    </div>

</div>

</body>
</html>";

                await SendEmailAsync(
                    adminEmail,
                    $"🔔 New EPIC Demo Request #{demoRequestId}",
                    html);

                Console.WriteLine(
                    $"New demo request notification sent to {adminEmail}.");
            }
            catch (Exception ex)
            {
                Console.WriteLine(
                    "Failed to send admin demo request notification:");

                Console.WriteLine(ex.Message);

                // Do not throw.
                // Database request has already been saved.
            }
        }


        // =====================================================
        // DEMO REQUEST - CONTACTED
        // =====================================================

        public async Task SendDemoRequestContactedAsync(
            string email,
            string fullName,
            string churchName)
        {
            try
            {
                var html = BuildStatusEmail(
                    title: "We Have Contacted You",
                    heading: "Your EPIC CMS Demo Request Has Been Updated",
                    fullName: fullName,
                    churchName: churchName,
                    status: "Contacted",
                    statusColor: "#2563eb",
                    statusBackground: "#dbeafe",
                    message:
                        "Our EPIC team has contacted you regarding your demo request. " +
                        "Thank you for your interest in EPIC Church Management System.");

                await SendEmailAsync(
                    email,
                    "EPIC CMS Demo Request – Contacted",
                    html);
            }
            catch (Exception ex)
            {
                Console.WriteLine(
                    "Failed to send contacted demo request email:");

                Console.WriteLine(ex.Message);
            }
        }


        // =====================================================
        // DEMO REQUEST - SCHEDULED
        // =====================================================

        public async Task SendDemoRequestScheduledAsync(
      string email,
      string fullName,
      string churchName,
      DateTime? scheduledDate)
        {
            try
            {
                var formattedDate =
      scheduledDate.HasValue
          ? scheduledDate.Value.ToString("MMMM dd, yyyy hh:mm tt")
          : "To be determined";

                var html = BuildStatusEmail(
                    title: "Demo Scheduled",
                    heading: "Your EPIC CMS Demo Has Been Scheduled",
                    fullName: fullName,
                    churchName: churchName,
                    status: "Scheduled",
                    statusColor: "#047857",
                    statusBackground: "#d1fae5",
                    message:
                        $"Your EPIC CMS demo has been scheduled for " +
                        $"<strong>{formattedDate}</strong>.<br /><br />" +
                        "We look forward to demonstrating how EPIC CMS " +
                        "can help your church manage its operations more efficiently.");

                await SendEmailAsync(
                    email,
                    "EPIC CMS Demo Scheduled",
                    html);
            }
            catch (Exception ex)
            {
                Console.WriteLine(
                    "Failed to send scheduled demo request email:");

                Console.WriteLine(ex.Message);
            }
        }


        // =====================================================
        // DEMO REQUEST - COMPLETED
        // =====================================================

        public async Task SendDemoRequestCompletedAsync(
            string email,
            string fullName,
            string churchName)
        {
            try
            {
                var html = BuildStatusEmail(
                    title: "Demo Completed",
                    heading: "Thank You for Attending the EPIC CMS Demo",
                    fullName: fullName,
                    churchName: churchName,
                    status: "Completed",
                    statusColor: "#15803d",
                    statusBackground: "#dcfce7",
                    message:
                        "Thank you for taking the time to attend the EPIC CMS demo. " +
                        "We hope the demonstration helped you see how EPIC can " +
                        "support your church's ministry and administrative needs.");

                await SendEmailAsync(
                    email,
                    "EPIC CMS Demo Completed – Thank You",
                    html);
            }
            catch (Exception ex)
            {
                Console.WriteLine(
                    "Failed to send completed demo request email:");

                Console.WriteLine(ex.Message);
            }
        }


        // =====================================================
        // DEMO REQUEST - CANCELLED
        // =====================================================

        public async Task SendDemoRequestCancelledAsync(
            string email,
            string fullName,
            string churchName)
        {
            try
            {
                var html = BuildStatusEmail(
                    title: "Demo Request Cancelled",
                    heading: "Your EPIC CMS Demo Request Has Been Cancelled",
                    fullName: fullName,
                    churchName: churchName,
                    status: "Cancelled",
                    statusColor: "#b91c1c",
                    statusBackground: "#fee2e2",
                    message:
                        "Your EPIC CMS demo request has been cancelled. " +
                        "If you would like to schedule another demonstration " +
                        "in the future, please submit a new demo request.");

                await SendEmailAsync(
                    email,
                    "EPIC CMS Demo Request – Cancelled",
                    html);
            }
            catch (Exception ex)
            {
                Console.WriteLine(
                    "Failed to send cancelled demo request email:");

                Console.WriteLine(ex.Message);
            }
        }


        // =====================================================
        // SUBSCRIPTION / PAYMENT NOTIFICATIONS
        // =====================================================

        public async Task SendSubscriptionCreatedAsync(
            string email, string contactName, string churchName,
            string planName, string billingCycle, decimal amount,
            int subscriptionId, string status)
        {
            var safeName = System.Net.WebUtility.HtmlEncode(contactName);
            var safeChurch = System.Net.WebUtility.HtmlEncode(churchName);
            var safePlan = System.Net.WebUtility.HtmlEncode(planName);
            var safeStatus = System.Net.WebUtility.HtmlEncode(status);
            var html = BuildTransactionEmail(
                "EPIC Subscription Received",
                $"Hello {safeName},",
                $"We received your EPIC subscription request for <strong>{safeChurch}</strong>.",
                $"Subscription #{subscriptionId} is currently <strong>{safeStatus}</strong> while payment is being reviewed.",
                $"Plan: <strong>{safePlan}</strong><br/>Billing: <strong>{billingCycle}</strong><br/>Amount: <strong>PHP {amount:N2}</strong>");
            await SafeSendAsync(email, "EPIC Subscription Request Received", html);
        }

        public async Task SendPaymentSubmittedAsync(
            string email, string contactName, string churchName,
            string planName, decimal amount, string currency,
            int paymentId, int subscriptionId, string paymentMethod, string? reference)
        {
            var safeName = System.Net.WebUtility.HtmlEncode(contactName);
            var safeChurch = System.Net.WebUtility.HtmlEncode(churchName);
            var safePlan = System.Net.WebUtility.HtmlEncode(planName);
            var safeMethod = System.Net.WebUtility.HtmlEncode(paymentMethod);
            var safeRef = System.Net.WebUtility.HtmlEncode(reference ?? "Not provided");
            var html = BuildTransactionEmail(
                "EPIC Payment Submitted",
                $"Hello {safeName},",
                $"Your payment submission for <strong>{safeChurch}</strong> has been received.",
                $"Payment #{paymentId} is <strong>PENDING</strong>. Our administration team will verify your payment before activation.",
                $"Subscription: <strong>#{subscriptionId}</strong><br/>Plan: <strong>{safePlan}</strong><br/>Amount: <strong>{currency} {amount:N2}</strong><br/>Method: <strong>{safeMethod}</strong><br/>Reference: <strong>{safeRef}</strong>");
            await SafeSendAsync(email, "EPIC Payment Submitted – Pending Verification", html);
        }

        public async Task SendPaymentStatusNotificationAsync(
            int paymentId, int subscriptionId, string email, string contactName,
            string churchName, string planName, string billingCycle, decimal amount,
            string currency, string status, string? reference)
        {
            var safeStatus = System.Net.WebUtility.HtmlEncode(status);
            var subject = status switch
            {
                "PAID" => "EPIC Payment Verified – Subscription Activated",
                "FAILED" => "EPIC Payment Update – Action Required",
                "REFUNDED" => "EPIC Payment Refunded – Subscription Update",
                _ => $"EPIC Payment Update – {safeStatus}"
            };
            var message = status == "PAID"
                ? "Your payment has been verified. Your EPIC subscription is now active."
                : status == "FAILED"
                    ? "Your payment could not be approved. Please contact EPIC administration or submit a new payment."
                    : status == "REFUNDED"
                        ? "Your payment was refunded and your subscription has been moved to past due."
                        : $"Your payment status is now <strong>{safeStatus}</strong>.";
            var safeName = System.Net.WebUtility.HtmlEncode(contactName);
            var safeChurch = System.Net.WebUtility.HtmlEncode(churchName);
            var safePlan = System.Net.WebUtility.HtmlEncode(planName);
            var safeRef = System.Net.WebUtility.HtmlEncode(reference ?? "Not provided");
            var html = BuildTransactionEmail(
                "EPIC Payment Status Update",
                $"Hello {safeName},",
                $"This is an update for <strong>{safeChurch}</strong>.",
                message,
                $"Payment: <strong>#{paymentId}</strong><br/>Subscription: <strong>#{subscriptionId}</strong><br/>Plan: <strong>{safePlan}</strong><br/>Billing: <strong>{billingCycle}</strong><br/>Amount: <strong>{currency} {amount:N2}</strong><br/>Reference: <strong>{safeRef}</strong>");
            await SafeSendAsync(email, subject, html);
        }

        private async Task SafeSendAsync(string email, string subject, string html)
        {
            try { await SendEmailAsync(email, subject, html); }
            catch (Exception ex)
            {
                Console.WriteLine($"EPIC email notification failed: {ex.Message}");
            }
        }

        private static string BuildTransactionEmail(string title, string greeting, string intro, string message, string details)
        {
            return $@"<!DOCTYPE html><html><body style='margin:0;padding:30px;background:#f5f7fb;font-family:Arial,sans-serif;'>
<div style='max-width:620px;margin:auto;background:#fff;border-radius:14px;overflow:hidden;box-shadow:0 4px 15px rgba(0,0,0,.08);'>
<div style='background:#0f172a;color:#fff;padding:26px 30px;'><h1 style='margin:0;color:#38bdf8;'>EPIC</h1><p style='margin:6px 0 0;opacity:.9;'>Engaging People Into Christ</p></div>
<div style='padding:30px;'><h2 style='color:#1e3a8a;'>{title}</h2><p>{greeting}</p><p>{intro}</p><div style='padding:18px;background:#f1f5f9;border-radius:10px;line-height:1.8;'>{details}</div><p style='margin-top:22px;'>{message}</p><p>God bless your ministry!</p><p><strong>EPIC Team</strong><br/>EPIC Church Management System</p><hr style='border:0;border-top:1px solid #e5e7eb;margin:28px 0;'><small style='color:#64748b;'>This is an automatic email from the EPIC Church Management System.</small></div></div></body></html>";
        }

        public async Task SendNewSubscriptionAdminNotificationAsync(
            string churchName, string contactName, string email, string phone,
            string planName, string billingCycle, decimal amount, int subscriptionId)
        {
            try
            {
                var admin = _configuration["Resend:AdminEmail"];
                if (string.IsNullOrWhiteSpace(admin)) return;
                var html = BuildTransactionEmail(
                    "New EPIC Subscription",
                    "A new subscription checkout was completed.",
                    $"<strong>{System.Net.WebUtility.HtmlEncode(churchName)}</strong> submitted an EPIC subscription request.",
                    "The subscription is waiting for payment verification.",
                    $"Subscription: <strong>#{subscriptionId}</strong><br/>Contact: <strong>{System.Net.WebUtility.HtmlEncode(contactName)}</strong><br/>Email: <strong>{System.Net.WebUtility.HtmlEncode(email)}</strong><br/>Phone: <strong>{System.Net.WebUtility.HtmlEncode(phone)}</strong><br/>Plan: <strong>{System.Net.WebUtility.HtmlEncode(planName)}</strong><br/>Billing: <strong>{System.Net.WebUtility.HtmlEncode(billingCycle)}</strong><br/>Amount: <strong>PHP {amount:N2}</strong>");
                await SafeSendAsync(admin, $"New EPIC Subscription #{subscriptionId}", html);
            }
            catch (Exception ex) { Console.WriteLine($"Admin subscription email failed: {ex.Message}"); }
        }

        public async Task SendNewPaymentAdminNotificationAsync(
            int paymentId, int subscriptionId, string churchName, string planName,
            decimal amount, string currency, string paymentMethod, string? reference)
        {
            try
            {
                var admin = _configuration["Resend:AdminEmail"];
                if (string.IsNullOrWhiteSpace(admin)) return;
                var html = BuildTransactionEmail(
                    "New EPIC Payment Awaiting Verification",
                    "A new payment proof has been submitted.",
                    $"<strong>{System.Net.WebUtility.HtmlEncode(churchName)}</strong> submitted a payment for review.",
                    "Open EPIC Payment Management to review the proof and mark the payment as paid or failed.",
                    $"Payment: <strong>#{paymentId}</strong><br/>Subscription: <strong>#{subscriptionId}</strong><br/>Plan: <strong>{System.Net.WebUtility.HtmlEncode(planName)}</strong><br/>Amount: <strong>{currency} {amount:N2}</strong><br/>Method: <strong>{System.Net.WebUtility.HtmlEncode(paymentMethod)}</strong><br/>Reference: <strong>{System.Net.WebUtility.HtmlEncode(reference ?? "Not provided")}</strong>");
                await SafeSendAsync(admin, $"Payment Verification Required #{paymentId}", html);
            }
            catch (Exception ex) { Console.WriteLine($"Admin payment email failed: {ex.Message}"); }
        }

        // =====================================================
        // STATUS EMAIL TEMPLATE
        // =====================================================

        private static string BuildStatusEmail(
            string title,
            string heading,
            string fullName,
            string churchName,
            string status,
            string statusColor,
            string statusBackground,
            string message)
        {
            return $@"
<!DOCTYPE html>
<html>

<body style='
    margin: 0;
    padding: 30px;
    background-color: #f5f7fb;
    font-family: Arial, sans-serif;
'>

<div style='
    max-width: 600px;
    margin: auto;
    background: #ffffff;
    border-radius: 14px;
    overflow: hidden;
    box-shadow: 0 4px 15px rgba(0,0,0,0.08);
'>

    <div style='
        background-color: #1e3a8a;
        color: white;
        padding: 25px 30px;
    '>

        <h1 style='
            margin: 0;
            font-size: 26px;
        '>
            EPIC
        </h1>

        <p style='
            margin: 8px 0 0 0;
            opacity: 0.9;
        '>
            Engaging People Into Christ
        </p>

    </div>

    <div style='padding: 30px;'>

        <h2 style='color: #1e3a8a;'>
            {heading}
        </h2>

        <p>
            Hello <strong>{fullName}</strong>,
        </p>

        <p>
            This is an update regarding your EPIC CMS demo request
            for <strong>{churchName}</strong>.
        </p>

        <div style='
            margin: 25px 0;
            padding: 15px 20px;
            background: {statusBackground};
            border-radius: 8px;
            color: {statusColor};
        '>

            <strong>
                Status: {status}
            </strong>

        </div>

        <p>
            {message}
        </p>

        <p>
            If you have any questions, please feel free to contact
            the EPIC team.
        </p>

        <p>
            God bless your ministry!
        </p>

        <p>
            <strong>EPIC Team</strong>
            <br />
            Engaging People Into Christ
        </p>

        <hr style='
            border: 0;
            border-top: 1px solid #e5e7eb;
            margin: 30px 0;
        '>

        <p style='
            color: #64748b;
            font-size: 13px;
        '>
            This is an automatic email from the
            EPIC Church Management System.
        </p>

    </div>

</div>

</body>
</html>";
        }
    }
}