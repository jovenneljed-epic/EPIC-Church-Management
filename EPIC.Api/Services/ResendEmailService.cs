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

            try
            {
                await SendEmailAsync(
                    email,
                    "We received your EPIC Demo Request!",
                    html);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Failed to send demo confirmation email to {email}: {ex.Message}");

                var adminEmail = _configuration["Resend:AdminEmail"];
                if (!string.IsNullOrWhiteSpace(adminEmail) &&
                    !string.Equals(email, adminEmail, StringComparison.OrdinalIgnoreCase))
                {
                    try
                    {
                        var sandboxNotice = $@"
<div style='background: #fff3cd; border: 1.5px solid #ffeeba; color: #856404; padding: 14px 18px; border-radius: 8px; margin-bottom: 24px; font-size: 13px; line-height: 1.5;'>
    <strong>⚠️ Resend Sandbox Mode Notice (Testing Address Unverified):</strong><br />
    This confirmation email was created for <strong>{fullName}</strong> ({email}).<br />
    Because your Resend account is currently configured with the default test sender (<code>onboarding@resend.dev</code>), Resend restricts delivery exclusively to your registered account email (<code>{adminEmail}</code>).
    <br /><br />
    <strong>To deliver emails directly to all requesters/visitors:</strong><br />
    1. Log into your Resend dashboard at <a href='https://resend.com/domains' target='_blank' style='color: #856404; font-weight: bold;'>resend.com/domains</a>.<br />
    2. Add and verify your custom church domain.<br />
    3. Update <code>Resend:FromEmail</code> to your verified domain.
</div>";

                        var htmlWithNotice = html.Replace(
                            "<div style='",
                            $"<div style='{sandboxNotice}");

                        await SendEmailAsync(
                            adminEmail,
                            $"[Requester Copy for {email}] We received your EPIC Demo Request!",
                            htmlWithNotice);

                        Console.WriteLine($"Delivered demo request preview copy to admin {adminEmail} due to Resend sandbox restriction.");
                    }
                    catch (Exception fallbackEx)
                    {
                        Console.WriteLine($"Fallback demo preview copy failed: {fallbackEx.Message}");
                    }
                }
            }
        }


        // =====================================================
        // SEND COURSE ENROLLMENT CONFIRMATION TO STUDENT
        // =====================================================

        public async Task SendCourseEnrollmentStudentConfirmationAsync(
            string fullName,
            string studentEmail,
            string courseCode,
            string courseTitle,
            string? cohort,
            string? memberStatus,
            string? mentorName,
            string referenceCode,
            DateTime enrolledDate)
        {
            var safeCohort = string.IsNullOrWhiteSpace(cohort) ? "Self-Paced Member LMS" : cohort;
            var safeStatus = string.IsNullOrWhiteSpace(memberStatus) ? "Active Member" : memberStatus;
            var safeMentor = string.IsNullOrWhiteSpace(mentorName) ? "To be assigned by Discipleship Dean" : mentorName;

            var html = $@"
<!DOCTYPE html>
<html>
<body style='margin: 0; padding: 30px; background-color: #f0f2f5; font-family: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, sans-serif;'>

<div style='max-width: 620px; margin: auto; background: #ffffff; border-radius: 14px; overflow: hidden; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08); border: 1px solid #e4e6eb;'>

    <div style='background: linear-gradient(135deg, #1877f2 0%, #0d5cb6 100%); color: #ffffff; padding: 32px 30px; text-align: center;'>
        <span style='background: rgba(255,255,255,0.2); color: #ffffff; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; padding: 4px 12px; border-radius: 20px; display: inline-block; margin-bottom: 12px;'>
            EPIC Discipleship Academy
        </span>
        <h1 style='margin: 0; font-size: 24px; font-weight: 800;'>
            🎓 Enrollment Confirmed!
        </h1>
        <p style='margin: 8px 0 0 0; opacity: 0.95; font-size: 14px;'>
            Engaging People Into Christ &bull; Luke 4:18 Ministries
        </p>
    </div>

    <div style='padding: 32px 30px;'>
        <h2 style='color: #050505; font-size: 20px; font-weight: 700; margin: 0 0 12px;'>
            Hello {fullName}!
        </h2>

        <p style='color: #65676b; font-size: 15px; line-height: 1.6; margin: 0 0 20px;'>
            Congratulations! Your free enrollment application for <strong style='color: #050505;'>{courseCode}: {courseTitle}</strong> has been successfully recorded and processed in the EPIC Discipleship Academy database.
        </p>

        <div style='background: #f7f8fa; border: 1.5px dashed #1877f2; border-radius: 12px; padding: 20px; margin-bottom: 24px;'>
            <div style='text-align: center; margin-bottom: 14px;'>
                <span style='font-size: 12px; color: #65676b; text-transform: uppercase; font-weight: 700; letter-spacing: 0.05em;'>Enrollment Reference Code</span>
                <div style='font-family: monospace; font-size: 18px; font-weight: 800; color: #1877f2; margin-top: 4px;'>{referenceCode}</div>
            </div>

            <table style='width: 100%; border-collapse: collapse; font-size: 14px;'>
                <tr>
                    <td style='padding: 8px 0; color: #65676b;'>Course Track:</td>
                    <td style='padding: 8px 0; font-weight: 700; color: #050505; text-align: right;'>{courseCode} &bull; {courseTitle}</td>
                </tr>
                <tr>
                    <td style='padding: 8px 0; color: #65676b; border-top: 1px solid #e4e6eb;'>Study Cohort:</td>
                    <td style='padding: 8px 0; font-weight: 600; color: #050505; text-align: right; border-top: 1px solid #e4e6eb;'>{safeCohort}</td>
                </tr>
                <tr>
                    <td style='padding: 8px 0; color: #65676b; border-top: 1px solid #e4e6eb;'>Member Status:</td>
                    <td style='padding: 8px 0; font-weight: 600; color: #050505; text-align: right; border-top: 1px solid #e4e6eb;'>{safeStatus}</td>
                </tr>
                <tr>
                    <td style='padding: 8px 0; color: #65676b; border-top: 1px solid #e4e6eb;'>Life Group Mentor:</td>
                    <td style='padding: 8px 0; font-weight: 600; color: #050505; text-align: right; border-top: 1px solid #e4e6eb;'>{safeMentor}</td>
                </tr>
                <tr>
                    <td style='padding: 8px 0; color: #65676b; border-top: 1px solid #e4e6eb;'>Application Date:</td>
                    <td style='padding: 8px 0; font-weight: 600; color: #050505; text-align: right; border-top: 1px solid #e4e6eb;'>{enrolledDate:MMMM dd, yyyy}</td>
                </tr>
            </table>
        </div>

        <h3 style='color: #050505; font-size: 16px; margin: 0 0 10px;'>What Happens Next?</h3>
        <ol style='color: #65676b; font-size: 14px; line-height: 1.6; padding-left: 20px; margin: 0 0 24px;'>
            <li style='margin-bottom: 8px;'><strong style='color: #050505;'>Orientation Syllabus:</strong> Our discipleship office will send your digital syllabus, module links, and reading materials to this email address.</li>
            <li style='margin-bottom: 8px;'><strong style='color: #050505;'>Member LMS Access:</strong> Active members can log into the EPIC Portal to track course progress, watch video lectures, and download worksheets.</li>
            <li style='margin-bottom: 8px;'><strong style='color: #050505;'>Weekly Study Huddle:</strong> Connect with your Life Group leader or cohort coordinator for discussion and practical ministry application.</li>
        </ol>

        <div style='background: #eff6ff; border-left: 4px solid #1877f2; padding: 14px 16px; border-radius: 6px; margin-bottom: 24px;'>
            <p style='color: #1e40af; font-size: 13px; font-style: italic; margin: 0;'>
                &ldquo;Study to shew thyself approved unto God, a workman that needeth not to be ashamed, rightly dividing the word of truth.&rdquo; &mdash; 2 Timothy 2:15
            </p>
        </div>

        <p style='color: #65676b; font-size: 14px; margin: 0;'>
            Warm regards in Christ,<br />
            <strong style='color: #050505;'>EPIC Discipleship Academy Pastoral Team</strong><br />
            Engaging People Into Christ
        </p>
    </div>

    <div style='background: #f7f8fa; border-top: 1px solid #e4e6eb; padding: 18px 30px; text-align: center; font-size: 12px; color: #8a8d91;'>
        This is an automated confirmation sent to {studentEmail} for your academy course enrollment.
    </div>

</div>

</body>
</html>";

            try
            {
                await SendEmailAsync(
                    studentEmail,
                    $"🎓 Enrollment Confirmed: {courseCode} - {courseTitle} | EPIC Academy",
                    html);

                Console.WriteLine($"Course enrollment student confirmation email sent to {studentEmail}.");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Failed to send course enrollment student confirmation to {studentEmail}: {ex.Message}");

                // If Resend rejected sending to an external recipient because of testing sandbox mode (onboarding@resend.dev):
                var adminEmail = _configuration["Resend:AdminEmail"];
                if (!string.IsNullOrWhiteSpace(adminEmail) &&
                    !string.Equals(studentEmail, adminEmail, StringComparison.OrdinalIgnoreCase))
                {
                    try
                    {
                        var sandboxNotice = $@"
<div style='background: #fff3cd; border: 1.5px solid #ffeeba; color: #856404; padding: 14px 18px; border-radius: 8px; margin-bottom: 24px; font-size: 13px; line-height: 1.5;'>
    <strong>⚠️ Resend Sandbox Mode Notice (Testing Address Unverified):</strong><br />
    This student confirmation email was created for <strong>{fullName}</strong> ({studentEmail}).<br />
    Because your Resend account is currently configured with the default test sender (<code>onboarding@resend.dev</code>), Resend restricts delivery exclusively to your registered account email (<code>{adminEmail}</code>).
    <br /><br />
    <strong>To deliver emails directly to all students/visitors:</strong><br />
    1. Log into your Resend dashboard at <a href='https://resend.com/domains' target='_blank' style='color: #856404; font-weight: bold;'>resend.com/domains</a>.<br />
    2. Add and verify your custom church domain (e.g. <code>epicchurch.com</code>).<br />
    3. Update <code>Resend:FromEmail</code> in your settings to use your verified domain.
</div>";

                        var studentHtmlWithNotice = html.Replace(
                            "<div style='padding: 32px 30px;'>",
                            $"<div style='padding: 32px 30px;'>{sandboxNotice}");

                        await SendEmailAsync(
                            adminEmail,
                            $"[Student Copy for {studentEmail}] 🎓 Enrollment Confirmed: {courseCode} - {courseTitle}",
                            studentHtmlWithNotice);

                        Console.WriteLine($"Delivered student preview copy to admin {adminEmail} due to Resend sandbox restriction.");
                    }
                    catch (Exception fallbackEx)
                    {
                        Console.WriteLine($"Fallback student preview copy failed: {fallbackEx.Message}");
                    }
                }
            }
        }


        // =====================================================
        // SEND COURSE ENROLLMENT NOTIFICATION TO ADMIN
        // =====================================================

        public async Task SendCourseEnrollmentAdminNotificationAsync(
            string fullName,
            string studentEmail,
            string? phone,
            string courseCode,
            string courseTitle,
            string? cohort,
            string? memberStatus,
            string? mentorName,
            string referenceCode,
            DateTime enrolledDate)
        {
            try
            {
                var adminEmail = _configuration["Resend:AdminEmail"];

                if (string.IsNullOrWhiteSpace(adminEmail))
                {
                    throw new InvalidOperationException("Resend AdminEmail is not configured.");
                }

                var safePhone = string.IsNullOrWhiteSpace(phone) ? "Not provided" : phone;
                var safeCohort = string.IsNullOrWhiteSpace(cohort) ? "Self-Paced Member LMS" : cohort;
                var safeStatus = string.IsNullOrWhiteSpace(memberStatus) ? "Active Member" : memberStatus;
                var safeMentor = string.IsNullOrWhiteSpace(mentorName) ? "None specified" : mentorName;

                var html = $@"
<!DOCTYPE html>
<html>
<body style='margin: 0; padding: 30px; background-color: #f0f2f5; font-family: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, sans-serif;'>

<div style='max-width: 650px; margin: auto; background: #ffffff; border-radius: 14px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.08); border: 1px solid #e4e6eb;'>

    <div style='background-color: #1e3a8a; color: #ffffff; padding: 25px 30px;'>
        <h1 style='margin: 0; font-size: 24px;'>
            🎓 New Academy Student Enrollment
        </h1>
        <p style='margin: 8px 0 0 0; opacity: 0.9; font-size: 14px;'>
            EPIC Discipleship Academy &bull; System Notification
        </p>
    </div>

    <div style='padding: 30px;'>
        <h2 style='color: #1e3a8a; font-size: 18px; margin: 0 0 16px;'>
            A new student has enrolled in {courseCode}.
        </h2>

        <table style='width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 14px;'>
            <tr>
                <td style='padding: 10px; font-weight: bold; background: #f8fafc; border: 1px solid #e2e8f0; width: 35%;'>Reference Code</td>
                <td style='padding: 10px; border: 1px solid #e2e8f0; font-family: monospace; font-weight: 700; color: #1877f2;'>{referenceCode}</td>
            </tr>
            <tr>
                <td style='padding: 10px; font-weight: bold; background: #f8fafc; border: 1px solid #e2e8f0;'>Student Full Name</td>
                <td style='padding: 10px; border: 1px solid #e2e8f0; font-weight: 700;'>{fullName}</td>
            </tr>
            <tr>
                <td style='padding: 10px; font-weight: bold; background: #f8fafc; border: 1px solid #e2e8f0;'>Student Email</td>
                <td style='padding: 10px; border: 1px solid #e2e8f0;'><a href='mailto:{studentEmail}'>{studentEmail}</a></td>
            </tr>
            <tr>
                <td style='padding: 10px; font-weight: bold; background: #f8fafc; border: 1px solid #e2e8f0;'>Phone Number</td>
                <td style='padding: 10px; border: 1px solid #e2e8f0;'>{safePhone}</td>
            </tr>
            <tr>
                <td style='padding: 10px; font-weight: bold; background: #f8fafc; border: 1px solid #e2e8f0;'>Course Track</td>
                <td style='padding: 10px; border: 1px solid #e2e8f0; font-weight: 700; color: #050505;'>{courseCode}: {courseTitle}</td>
            </tr>
            <tr>
                <td style='padding: 10px; font-weight: bold; background: #f8fafc; border: 1px solid #e2e8f0;'>Preferred Cohort</td>
                <td style='padding: 10px; border: 1px solid #e2e8f0;'>{safeCohort}</td>
            </tr>
            <tr>
                <td style='padding: 10px; font-weight: bold; background: #f8fafc; border: 1px solid #e2e8f0;'>Member Status</td>
                <td style='padding: 10px; border: 1px solid #e2e8f0;'>{safeStatus}</td>
            </tr>
            <tr>
                <td style='padding: 10px; font-weight: bold; background: #f8fafc; border: 1px solid #e2e8f0;'>Life Group Mentor</td>
                <td style='padding: 10px; border: 1px solid #e2e8f0;'>{safeMentor}</td>
            </tr>
            <tr>
                <td style='padding: 10px; font-weight: bold; background: #f8fafc; border: 1px solid #e2e8f0;'>Enrolled Timestamp</td>
                <td style='padding: 10px; border: 1px solid #e2e8f0;'>{enrolledDate:yyyy-MM-dd HH:mm:ss} UTC</td>
            </tr>
        </table>

        <div style='margin-top: 24px; padding: 14px; background: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 8px; color: #065f46; font-size: 13px; font-weight: 600;'>
            Status: Recorded in Database &bull; Active Intake Queue
        </div>

        <p style='margin-top: 24px; font-size: 14px; color: #475569;'>
            Please open the <strong>Contact Requests</strong> module in the EPIC Church Management sidebar to review this student and assign life group mentors.
        </p>

        <hr style='border: 0; border-top: 1px solid #e5e7eb; margin: 25px 0;' />

        <p style='color: #64748b; font-size: 12px; margin: 0;'>
            This is an automated notification generated by EPIC Church Management System.
        </p>
    </div>

</div>

</body>
</html>";

                await SendEmailAsync(
                    adminEmail,
                    $"🎓 New Academy Enrollment: {fullName} ({courseCode})",
                    html);

                Console.WriteLine($"New course enrollment notification sent to admin {adminEmail}.");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Failed to send admin course enrollment notification: {ex.Message}");
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

        // =====================================================
        // SEND CONTACT INQUIRY CONFIRMATION TO SENDER
        // =====================================================

        public async Task SendContactInquirySenderConfirmationAsync(
            string fullName,
            string email,
            string? phone,
            string departmentOrSubject,
            string messageText,
            int inquiryId,
            DateTime receivedDate)
        {
            var refCode = $"EPIC-INQ-{inquiryId:D6}";
            var safePhone = string.IsNullOrWhiteSpace(phone) ? "Not provided" : phone;
            var safeMessage = string.IsNullOrWhiteSpace(messageText) ? "No message text provided." : messageText;

            var html = $@"
<!DOCTYPE html>
<html>
<body style='margin: 0; padding: 30px; background-color: #f0f2f5; font-family: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, sans-serif;'>

<div style='max-width: 620px; margin: auto; background: #ffffff; border-radius: 14px; overflow: hidden; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08); border: 1px solid #e4e6eb;'>

    <div style='background: linear-gradient(135deg, #1877f2 0%, #0d5cb6 100%); color: #ffffff; padding: 32px 30px; text-align: center;'>
        <span style='background: rgba(255,255,255,0.2); color: #ffffff; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; padding: 4px 12px; border-radius: 20px; display: inline-block; margin-bottom: 12px;'>
            Pastoral Care &amp; Church Office
        </span>
        <h1 style='margin: 0; font-size: 24px; font-weight: 800;'>
            📩 We Received Your Message
        </h1>
        <p style='margin: 8px 0 0 0; opacity: 0.95; font-size: 14px;'>
            Engaging People Into Christ &bull; Luke 4:18 Ministries
        </p>
    </div>

    <div style='padding: 32px 30px;'>
        <h2 style='color: #050505; font-size: 20px; font-weight: 700; margin: 0 0 12px;'>
            Hello {fullName}!
        </h2>

        <p style='color: #65676b; font-size: 15px; line-height: 1.6; margin: 0 0 20px;'>
            Thank you for reaching out to <strong style='color: #050505;'>EPIC Church &amp; Luke 4:18 Ministries</strong>. We have received your inquiry and recorded it in our church communication database.
        </p>

        <div style='background: #f7f8fa; border: 1.5px dashed #1877f2; border-radius: 12px; padding: 20px; margin-bottom: 24px;'>
            <div style='text-align: center; margin-bottom: 14px;'>
                <span style='font-size: 12px; color: #65676b; text-transform: uppercase; font-weight: 700; letter-spacing: 0.05em;'>Inquiry Reference Number</span>
                <div style='font-family: monospace; font-size: 18px; font-weight: 800; color: #1877f2; margin-top: 4px;'>{refCode}</div>
            </div>

            <table style='width: 100%; border-collapse: collapse; font-size: 14px;'>
                <tr>
                    <td style='padding: 8px 0; color: #65676b;'>Requester Name:</td>
                    <td style='padding: 8px 0; font-weight: 700; color: #050505; text-align: right;'>{fullName}</td>
                </tr>
                <tr>
                    <td style='padding: 8px 0; color: #65676b; border-top: 1px solid #e4e6eb;'>Email Address:</td>
                    <td style='padding: 8px 0; font-weight: 600; color: #050505; text-align: right; border-top: 1px solid #e4e6eb;'>{email}</td>
                </tr>
                <tr>
                    <td style='padding: 8px 0; color: #65676b; border-top: 1px solid #e4e6eb;'>Phone Number:</td>
                    <td style='padding: 8px 0; font-weight: 600; color: #050505; text-align: right; border-top: 1px solid #e4e6eb;'>{safePhone}</td>
                </tr>
                <tr>
                    <td style='padding: 8px 0; color: #65676b; border-top: 1px solid #e4e6eb;'>Department / Topic:</td>
                    <td style='padding: 8px 0; font-weight: 700; color: #1877f2; text-align: right; border-top: 1px solid #e4e6eb;'>{departmentOrSubject}</td>
                </tr>
                <tr>
                    <td style='padding: 8px 0; color: #65676b; border-top: 1px solid #e4e6eb;'>Date Submitted:</td>
                    <td style='padding: 8px 0; font-weight: 600; color: #050505; text-align: right; border-top: 1px solid #e4e6eb;'>{receivedDate:MMMM dd, yyyy h:mm tt} UTC</td>
                </tr>
            </table>

            <div style='margin-top: 16px; padding-top: 14px; border-top: 1px solid #e4e6eb;'>
                <span style='font-size: 12px; color: #65676b; font-weight: 700; text-transform: uppercase;'>Your Message / Request:</span>
                <div style='margin-top: 6px; padding: 12px; background: #ffffff; border-radius: 8px; border: 1px solid #e4e6eb; color: #050505; font-size: 14px; line-height: 1.5; white-space: pre-wrap;'>{safeMessage}</div>
            </div>
        </div>

        <h3 style='color: #050505; font-size: 16px; margin: 0 0 10px;'>What Happens Next?</h3>
        <p style='color: #65676b; font-size: 14px; line-height: 1.6; margin: 0 0 14px;'>
            Our pastoral and ministry coordinators review incoming communications daily. For prayer requests, our intercessory team begins praying over your needs immediately. For church inquiries or counseling scheduling, our office will connect with you within 24&ndash;48 hours.
        </p>

        <div style='background: #eff6ff; border-left: 4px solid #1877f2; padding: 14px 16px; border-radius: 6px; margin-bottom: 24px;'>
            <p style='color: #1e40af; font-size: 13px; font-style: italic; margin: 0;'>
                &ldquo;Do not be anxious about anything, but in every situation, by prayer and petition, with thanksgiving, present your requests to God.&rdquo; &mdash; Philippians 4:6
            </p>
        </div>

        <p style='color: #65676b; font-size: 14px; margin: 0;'>
            Standing with you in faith,<br />
            <strong style='color: #050505;'>EPIC Pastoral &amp; Ministry Team</strong><br />
            Luke 4:18 Ministries
        </p>
    </div>

    <div style='background: #f7f8fa; border-top: 1px solid #e4e6eb; padding: 18px 30px; text-align: center; font-size: 12px; color: #8a8d91;'>
        This confirmation was sent to {email}. If you did not send this inquiry, please disregard this email.
    </div>

</div>

</body>
</html>";

            try
            {
                await SendEmailAsync(
                    email,
                    $"📩 We Received Your Message: {departmentOrSubject} | EPIC Church",
                    html);

                Console.WriteLine($"Contact inquiry confirmation email sent to {email}.");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Failed to send contact inquiry confirmation to {email}: {ex.Message}");

                var adminEmail = _configuration["Resend:AdminEmail"];
                if (!string.IsNullOrWhiteSpace(adminEmail) &&
                    !string.Equals(email, adminEmail, StringComparison.OrdinalIgnoreCase))
                {
                    try
                    {
                        var sandboxNotice = $@"
<div style='background: #fff3cd; border: 1.5px solid #ffeeba; color: #856404; padding: 14px 18px; border-radius: 8px; margin-bottom: 24px; font-size: 13px; line-height: 1.5;'>
    <strong>⚠️ Resend Sandbox Mode Notice (Testing Address Unverified):</strong><br />
    This confirmation copy was intended for <strong>{fullName}</strong> ({email}).<br />
    Because your Resend account is currently configured with the test domain (<code>onboarding@resend.dev</code>), Resend only delivers to your registered account email (<code>{adminEmail}</code>).
    <br /><br />
    <strong>To deliver emails directly to external visitors:</strong><br />
    Verify your custom domain at <a href='https://resend.com/domains' target='_blank' style='color: #856404; font-weight: bold;'>resend.com/domains</a>.
</div>";

                        var htmlWithNotice = html.Replace(
                            "<div style='padding: 32px 30px;'>",
                            "<div style='padding: 32px 30px;'>" + sandboxNotice);

                        await SendEmailAsync(
                            adminEmail,
                            $"[Requester Copy for {email}] 📩 We Received Your Message: {departmentOrSubject}",
                            htmlWithNotice);

                        Console.WriteLine($"Delivered contact inquiry preview copy to admin {adminEmail} due to Resend sandbox restriction.");
                    }
                    catch (Exception fallbackEx)
                    {
                        Console.WriteLine($"Fallback contact inquiry preview copy failed: {fallbackEx.Message}");
                    }
                }
            }
        }

        // =====================================================
        // SEND CONTACT INQUIRY NOTIFICATION TO ADMIN
        // =====================================================

        public async Task SendContactInquiryAdminNotificationAsync(
            string fullName,
            string email,
            string? phone,
            string departmentOrSubject,
            string messageText,
            int inquiryId,
            DateTime receivedDate)
        {
            try
            {
                var adminEmail = _configuration["Resend:AdminEmail"];

                if (string.IsNullOrWhiteSpace(adminEmail))
                {
                    throw new InvalidOperationException("Resend AdminEmail is not configured.");
                }

                var refCode = $"EPIC-INQ-{inquiryId:D6}";
                var safePhone = string.IsNullOrWhiteSpace(phone) ? "Not provided" : phone;
                var safeMessage = string.IsNullOrWhiteSpace(messageText) ? "No message text provided." : messageText;

                var html = $@"
<!DOCTYPE html>
<html>
<body style='margin: 0; padding: 30px; background-color: #f0f2f5; font-family: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, sans-serif;'>

<div style='max-width: 650px; margin: auto; background: #ffffff; border-radius: 14px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.08); border: 1px solid #e4e6eb;'>

    <div style='background-color: #1877f2; color: #ffffff; padding: 25px 30px;'>
        <h1 style='margin: 0; font-size: 24px;'>
            📩 New Website Contact Inquiry
        </h1>
        <p style='margin: 8px 0 0 0; opacity: 0.95; font-size: 14px;'>
            EPIC Church Management System &bull; Luke 4:18 Ministries
        </p>
    </div>

    <div style='padding: 30px;'>
        <h2 style='color: #050505; font-size: 18px; margin: 0 0 16px;'>
            A new inquiry has been submitted via the website contact form.
        </h2>

        <table style='width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 14px;'>
            <tr>
                <td style='padding: 10px; font-weight: bold; background: #f8fafc; border: 1px solid #e2e8f0; width: 35%;'>Reference Code</td>
                <td style='padding: 10px; border: 1px solid #e2e8f0; font-family: monospace; font-weight: 700; color: #1877f2;'>{refCode}</td>
            </tr>
            <tr>
                <td style='padding: 10px; font-weight: bold; background: #f8fafc; border: 1px solid #e2e8f0;'>Requester Full Name</td>
                <td style='padding: 10px; border: 1px solid #e2e8f0; font-weight: 700; color: #050505;'>{fullName}</td>
            </tr>
            <tr>
                <td style='padding: 10px; font-weight: bold; background: #f8fafc; border: 1px solid #e2e8f0;'>Email Address</td>
                <td style='padding: 10px; border: 1px solid #e2e8f0;'><a href='mailto:{email}' style='color: #1877f2; font-weight: 600;'>{email}</a></td>
            </tr>
            <tr>
                <td style='padding: 10px; font-weight: bold; background: #f8fafc; border: 1px solid #e2e8f0;'>Phone Number</td>
                <td style='padding: 10px; border: 1px solid #e2e8f0;'>{safePhone}</td>
            </tr>
            <tr>
                <td style='padding: 10px; font-weight: bold; background: #f8fafc; border: 1px solid #e2e8f0;'>Department / Topic</td>
                <td style='padding: 10px; border: 1px solid #e2e8f0; font-weight: 700; color: #1877f2;'>{departmentOrSubject}</td>
            </tr>
            <tr>
                <td style='padding: 10px; font-weight: bold; background: #f8fafc; border: 1px solid #e2e8f0;'>Submitted At</td>
                <td style='padding: 10px; border: 1px solid #e2e8f0;'>{receivedDate:yyyy-MM-dd HH:mm:ss} UTC</td>
            </tr>
        </table>

        <div style='margin-top: 20px; padding: 16px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px;'>
            <strong style='display: block; margin-bottom: 8px; color: #334155; font-size: 13px; text-transform: uppercase;'>Message Content:</strong>
            <div style='color: #050505; font-size: 14px; line-height: 1.6; white-space: pre-wrap;'>{safeMessage}</div>
        </div>

        <div style='margin-top: 24px; padding: 14px; background: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 8px; color: #065f46; font-size: 13px; font-weight: 600;'>
            Status: Recorded in Database &bull; Contact Requests Queue
        </div>

        <p style='margin-top: 24px; font-size: 14px; color: #475569;'>
            Open the <strong>Contact Requests</strong> module in the EPIC Church Management sidebar to manage status, add pastoral notes, or contact this person.
        </p>

        <hr style='border: 0; border-top: 1px solid #e5e7eb; margin: 25px 0;' />

        <p style='color: #64748b; font-size: 12px; margin: 0;'>
            This is an automated notification from the EPIC Church Management System.
        </p>
    </div>

</div>

</body>
</html>";

                await SendEmailAsync(
                    adminEmail,
                    $"📩 New Contact Inquiry: [{departmentOrSubject}] from {fullName}",
                    html);

                Console.WriteLine($"New contact inquiry notification sent to admin {adminEmail}.");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Failed to send admin contact inquiry notification: {ex.Message}");
            }
        }

        // =====================================================
        // GIVING - DONOR OFFICIAL ACKNOWLEDGMENT RECEIPT
        // =====================================================

        public async Task SendGivingReceiptDonorConfirmationAsync(
            string donorName,
            string donorEmail,
            decimal amount,
            string givingType,
            string paymentMethod,
            string referenceNumber,
            string receiptCode,
            string frequency,
            string? prayerRequest,
            DateTime givingDate)
        {
            if (string.IsNullOrWhiteSpace(donorEmail)) return;

            try
            {
                var safeName = System.Net.WebUtility.HtmlEncode(string.IsNullOrWhiteSpace(donorName) ? "Beloved Partner in Faith" : donorName);
                var safeGivingType = System.Net.WebUtility.HtmlEncode(givingType);
                var safePaymentMethod = System.Net.WebUtility.HtmlEncode(paymentMethod);
                var safeRefNumber = System.Net.WebUtility.HtmlEncode(string.IsNullOrWhiteSpace(referenceNumber) ? "N/A" : referenceNumber);
                var safeReceiptCode = System.Net.WebUtility.HtmlEncode(receiptCode);
                var safeFreq = System.Net.WebUtility.HtmlEncode(frequency);
                var safePrayer = System.Net.WebUtility.HtmlEncode(prayerRequest ?? "");

                var html = $@"
<!DOCTYPE html>
<html>
<body style='margin: 0; padding: 25px 15px; background-color: #f0f2f5; font-family: -apple-system, BlinkMacSystemFont, ""Segoe UI"", Roboto, Helvetica, Arial, sans-serif;'>

<div style='max-width: 620px; margin: auto; background: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e4e6eb; box-shadow: 0 4px 16px rgba(0,0,0,0.06);'>

    <div style='background: linear-gradient(135deg, #1877f2 0%, #0d5ec4 100%); padding: 32px 28px; text-align: center; color: #ffffff;'>
        <div style='display: inline-block; background: rgba(255, 255, 255, 0.2); padding: 5px 14px; border-radius: 20px; font-size: 11px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 12px;'>
            Official Electronic Stewardship Receipt
        </div>
        <h1 style='margin: 0 0 6px 0; font-size: 26px; font-weight: 800; letter-spacing: -0.5px;'>
            EPIC CHURCH STEWARDSHIP
        </h1>
        <p style='margin: 0; font-size: 14px; opacity: 0.9;'>
            Honoring God with our Firstfruits and Joyful Generosity
        </p>
    </div>

    <div style='padding: 30px 28px;'>
        <h2 style='margin: 0 0 12px 0; color: #050505; font-size: 20px; font-weight: 700;'>
            Thank you, {safeName}!
        </h2>

        <p style='color: #475569; font-size: 14px; line-height: 1.6; margin: 0 0 20px 0;'>
            We have received and recorded your generous transfer in the official financial ledger of <strong>EPIC Church</strong>. May the Lord multiply your seed sown and open heaven's windows over your household.
        </p>

        <div style='background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 18px; margin-bottom: 24px;'>
            <blockquote style='margin: 0; font-style: italic; color: #334155; font-size: 14px; line-height: 1.6;'>
                &ldquo;Bring the whole tithe into the storehouse, that there may be food in my house. Test me in this,&rdquo; says the Lord Almighty, &ldquo;and see if I will not throw open the floodgates of heaven and pour out so much blessing that there will not be room enough to store it.&rdquo;
            </blockquote>
            <div style='text-align: right; color: #1877f2; font-weight: 700; font-size: 12px; margin-top: 8px;'>
                — Malachi 3:10 (NIV)
            </div>
        </div>

        <div style='background: #e7f3ff; border: 2px solid #1877f2; border-radius: 10px; padding: 20px; text-align: center; margin-bottom: 24px;'>
            <span style='font-size: 12px; font-weight: 700; color: #1877f2; text-transform: uppercase; letter-spacing: 0.5px;'>Total Amount Recorded</span>
            <div style='font-size: 32px; font-weight: 800; color: #050505; margin: 6px 0;'>
                PHP {amount:N2}
            </div>
            <span style='display: inline-block; background: #ffffff; color: #065f46; border: 1px solid #a7f3d0; border-radius: 14px; padding: 3px 12px; font-size: 12px; font-weight: 700;'>
                &#10003; Verified &amp; Logged in Stewardship Ledger
            </span>
        </div>

        <table style='width: 100%; border-collapse: collapse; font-size: 13px; margin-bottom: 24px;'>
            <tr>
                <td style='padding: 10px 12px; border: 1px solid #e2e8f0; background: #f8fafc; font-weight: 600; color: #64748b; width: 40%;'>Receipt Number</td>
                <td style='padding: 10px 12px; border: 1px solid #e2e8f0; font-weight: 700; color: #1877f2;'>{safeReceiptCode}</td>
            </tr>
            <tr>
                <td style='padding: 10px 12px; border: 1px solid #e2e8f0; background: #f8fafc; font-weight: 600; color: #64748b;'>Kingdom Fund / Purpose</td>
                <td style='padding: 10px 12px; border: 1px solid #e2e8f0; font-weight: 700; color: #050505;'>{safeGivingType}</td>
            </tr>
            <tr>
                <td style='padding: 10px 12px; border: 1px solid #e2e8f0; background: #f8fafc; font-weight: 600; color: #64748b;'>Payment Method</td>
                <td style='padding: 10px 12px; border: 1px solid #e2e8f0; font-weight: 700; color: #050505;'>{safePaymentMethod}</td>
            </tr>
            <tr>
                <td style='padding: 10px 12px; border: 1px solid #e2e8f0; background: #f8fafc; font-weight: 600; color: #64748b;'>Transaction Ref #</td>
                <td style='padding: 10px 12px; border: 1px solid #e2e8f0; font-family: monospace; font-weight: 700; color: #050505;'>{safeRefNumber}</td>
            </tr>
            <tr>
                <td style='padding: 10px 12px; border: 1px solid #e2e8f0; background: #f8fafc; font-weight: 600; color: #64748b;'>Giving Frequency</td>
                <td style='padding: 10px 12px; border: 1px solid #e2e8f0; color: #050505;'>{safeFreq}</td>
            </tr>
            <tr>
                <td style='padding: 10px 12px; border: 1px solid #e2e8f0; background: #f8fafc; font-weight: 600; color: #64748b;'>Date &amp; Time Recorded</td>
                <td style='padding: 10px 12px; border: 1px solid #e2e8f0; color: #050505;'>{givingDate:MMMM dd, yyyy - hh:mm tt}</td>
            </tr>
        </table>

        {(string.IsNullOrWhiteSpace(safePrayer) ? "" : $@"
        <div style='background: #fdf6e2; border: 1px solid #fed7aa; border-radius: 8px; padding: 14px; margin-bottom: 24px;'>
            <strong style='display: block; color: #9a3412; font-size: 12px; text-transform: uppercase; margin-bottom: 4px;'>Your Prayer Request / Dedication Note:</strong>
            <p style='margin: 0; color: #431407; font-size: 13px; font-style: italic;'>&ldquo;{safePrayer}&rdquo;</p>
            <small style='display: block; margin-top: 6px; color: #9a3412; font-size: 11px;'>Our pastoral and intercessory prayer teams are lifting this petition before God.</small>
        </div>
        ")}

        <p style='color: #64748b; font-size: 12px; line-height: 1.5; margin: 0 0 20px 0;'>
            This digital acknowledgment serves as your official contribution record. It will be consolidated into your Annual Member Giving Statement. For questions or adjustments, please reply directly to this email or contact the EPIC Church Stewardship Office.
        </p>

        <hr style='border: 0; border-top: 1px solid #e4e6eb; margin: 24px 0;' />

        <div style='text-align: center; color: #8a8d91; font-size: 11px;'>
            <p style='margin: 0 0 4px 0; font-weight: 700; color: #65676b;'>EPIC Church Ministries &bull; Stewardship Office</p>
            <p style='margin: 0;'>Verified Cashless Accounts: GCash &amp; Maya (0995-632-6245)</p>
        </div>
    </div>

</div>

</body>
</html>";

                await SendEmailAsync(
                    donorEmail,
                    $"🕊️ Giving Receipt #{receiptCode} – Thank You for Honoring God at EPIC Church",
                    html);

                Console.WriteLine($"Giving confirmation receipt sent to donor {donorEmail} (Receipt: {receiptCode}).");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Failed to send donor giving receipt: {ex.Message}");
            }
        }

        // =====================================================
        // GIVING - ADMIN / FINANCE TEAM NOTIFICATION
        // =====================================================

        public async Task SendGivingAlertAdminNotificationAsync(
            string donorName,
            string? donorEmail,
            string? phone,
            decimal amount,
            string givingType,
            string paymentMethod,
            string referenceNumber,
            string receiptCode,
            string frequency,
            string? prayerRequest,
            DateTime givingDate)
        {
            try
            {
                var adminEmail = _configuration["Resend:AdminEmail"] ?? "jovenneljed@gmail.com";
                var safeName = System.Net.WebUtility.HtmlEncode(string.IsNullOrWhiteSpace(donorName) ? "Anonymous Giver" : donorName);
                var safeEmail = System.Net.WebUtility.HtmlEncode(string.IsNullOrWhiteSpace(donorEmail) ? "None provided" : donorEmail);
                var safePhone = System.Net.WebUtility.HtmlEncode(string.IsNullOrWhiteSpace(phone) ? "None provided" : phone);
                var safeGivingType = System.Net.WebUtility.HtmlEncode(givingType);
                var safePaymentMethod = System.Net.WebUtility.HtmlEncode(paymentMethod);
                var safeRefNumber = System.Net.WebUtility.HtmlEncode(string.IsNullOrWhiteSpace(referenceNumber) ? "N/A" : referenceNumber);
                var safeReceiptCode = System.Net.WebUtility.HtmlEncode(receiptCode);
                var safeFreq = System.Net.WebUtility.HtmlEncode(frequency);
                var safePrayer = System.Net.WebUtility.HtmlEncode(prayerRequest ?? "None");

                var html = $@"
<!DOCTYPE html>
<html>
<body style='margin: 0; padding: 25px 15px; background-color: #f0f2f5; font-family: -apple-system, BlinkMacSystemFont, ""Segoe UI"", Roboto, Helvetica, Arial, sans-serif;'>

<div style='max-width: 620px; margin: auto; background: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e4e6eb; box-shadow: 0 4px 16px rgba(0,0,0,0.06);'>

    <div style='background: #065f46; padding: 24px 28px; color: #ffffff;'>
        <span style='background: rgba(255,255,255,0.2); padding: 4px 10px; border-radius: 12px; font-size: 11px; font-weight: 700; text-transform: uppercase;'>
            EPIC Finance &bull; Online Giving Alert
        </span>
        <h1 style='margin: 10px 0 4px 0; font-size: 22px; font-weight: 800;'>
            New Giving Transfer Recorded
        </h1>
        <p style='margin: 0; font-size: 13px; opacity: 0.9;'>
            Receipt Code: {safeReceiptCode} &bull; Channel: {safePaymentMethod}
        </p>
    </div>

    <div style='padding: 24px 28px;'>
        <div style='background: #ecfdf5; border: 2px solid #059669; border-radius: 10px; padding: 18px; text-align: center; margin-bottom: 20px;'>
            <span style='font-size: 11px; font-weight: 700; color: #065f46; text-transform: uppercase;'>Transfer Amount</span>
            <div style='font-size: 30px; font-weight: 800; color: #065f46; margin: 4px 0;'>
                PHP {amount:N2}
            </div>
            <span style='font-size: 12px; font-weight: 600; color: #047857;'>
                Designation: {safeGivingType} ({safeFreq})
            </span>
        </div>

        <table style='width: 100%; border-collapse: collapse; font-size: 13px; margin-bottom: 20px;'>
            <tr>
                <td style='padding: 9px 12px; border: 1px solid #e2e8f0; background: #f8fafc; font-weight: 600; color: #64748b; width: 40%;'>Giver / Donor Name</td>
                <td style='padding: 9px 12px; border: 1px solid #e2e8f0; font-weight: 700; color: #050505;'>{safeName}</td>
            </tr>
            <tr>
                <td style='padding: 9px 12px; border: 1px solid #e2e8f0; background: #f8fafc; font-weight: 600; color: #64748b;'>Email Address</td>
                <td style='padding: 9px 12px; border: 1px solid #e2e8f0;'><a href='mailto:{safeEmail}' style='color: #1877f2;'>{safeEmail}</a></td>
            </tr>
            <tr>
                <td style='padding: 9px 12px; border: 1px solid #e2e8f0; background: #f8fafc; font-weight: 600; color: #64748b;'>Mobile Number</td>
                <td style='padding: 9px 12px; border: 1px solid #e2e8f0; font-weight: 600;'>{safePhone}</td>
            </tr>
            <tr>
                <td style='padding: 9px 12px; border: 1px solid #e2e8f0; background: #f8fafc; font-weight: 600; color: #64748b;'>Wallet / Bank Channel</td>
                <td style='padding: 9px 12px; border: 1px solid #e2e8f0; font-weight: 700; color: #1877f2;'>{safePaymentMethod}</td>
            </tr>
            <tr>
                <td style='padding: 9px 12px; border: 1px solid #e2e8f0; background: #f8fafc; font-weight: 600; color: #64748b;'>Transaction Ref #</td>
                <td style='padding: 9px 12px; border: 1px solid #e2e8f0; font-family: monospace; font-weight: 700; color: #b91c1c; font-size: 14px;'>{safeRefNumber}</td>
            </tr>
            <tr>
                <td style='padding: 9px 12px; border: 1px solid #e2e8f0; background: #f8fafc; font-weight: 600; color: #64748b;'>Recorded Timestamp</td>
                <td style='padding: 9px 12px; border: 1px solid #e2e8f0;'>{givingDate:yyyy-MM-dd HH:mm:ss} UTC</td>
            </tr>
        </table>

        <div style='background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px; margin-bottom: 20px;'>
            <strong style='display: block; color: #334155; font-size: 12px; text-transform: uppercase; margin-bottom: 4px;'>Prayer Request / Note:</strong>
            <p style='margin: 0; color: #050505; font-size: 13px;'>{safePrayer}</p>
        </div>

        <div style='background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 14px; color: #1e40af; font-size: 12px; font-weight: 600;'>
            &#128269; <strong>Reconciliation Action:</strong> Please cross-check your GCash/Maya business wallet or bank statement using Reference #{safeRefNumber} to confirm balance credit.
        </div>

        <hr style='border: 0; border-top: 1px solid #e4e6eb; margin: 24px 0;' />

        <p style='color: #8a8d91; font-size: 11px; margin: 0;'>
            Automated financial notification from EPIC Church Management System.
        </p>
    </div>

</div>

</body>
</html>";

                await SendEmailAsync(
                    adminEmail,
                    $"💰 New Giving Alert: PHP {amount:N2} ({safeGivingType}) via {safePaymentMethod} [Ref: {safeRefNumber}]",
                    html);

                Console.WriteLine($"Giving alert sent to admin {adminEmail} for {receiptCode}.");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Failed to send admin giving alert: {ex.Message}");
            }
        }
    }
}