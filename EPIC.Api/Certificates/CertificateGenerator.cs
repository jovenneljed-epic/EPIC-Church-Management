using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;

namespace EPIC.Api.Certificates
{
    public class CertificateGenerator
    {
        public string Generate(
            string certificateNumber,
            string recipientName,
            string courseTitle)
        {

            var folder =
                Path.Combine(
                    Directory.GetCurrentDirectory(),
                    "wwwroot",
                    "certificates"
                );


            if (!Directory.Exists(folder))
            {
                Directory.CreateDirectory(folder);
            }



            var fileName =
                $"{certificateNumber}.pdf";



            var filePath =
                Path.Combine(
                    folder,
                    fileName
                );



            Document
                .Create(container =>
                {
                    container.Page(page =>
                    {
                        page.Size(PageSizes.A4.Landscape());

                        page.Margin(50);


                        page.Content()
                            .Column(column =>
                            {

                                column.Spacing(20);



                                column.Item()
                                    .AlignCenter()
                                    .Text(
                                        "EPIC LEARNING CERTIFICATE"
                                    )
                                    .FontSize(30)
                                    .Bold();



                                column.Item()
                                    .AlignCenter()
                                    .Text(
                                        "This certificate is proudly presented to"
                                    )
                                    .FontSize(16);



                                column.Item()
                                    .AlignCenter()
                                    .Text(
                                        recipientName
                                    )
                                    .FontSize(28)
                                    .Bold();



                                column.Item()
                                    .AlignCenter()
                                    .Text(
                                        $"For completing the course: {courseTitle}"
                                    )
                                    .FontSize(18);



                                column.Item()
                                    .AlignCenter()
                                    .Text(
                                        $"Certificate No: {certificateNumber}"
                                    )
                                    .FontSize(14);



                                column.Item()
                                    .AlignCenter()
                                    .Text(
                                        $"Issued Date: {DateTime.UtcNow:MMMM dd, yyyy}"
                                    )
                                    .FontSize(14);

                            });

                    });
                })
                .GeneratePdf(filePath);



            return
                $"/certificates/{fileName}";
        }
    }
}