using SkiaSharp;
namespace EPIC.Api.Services;

public static class CommunityPhotoService
{
    public static byte[] Normalize(string base64)
    {
        if (string.IsNullOrWhiteSpace(base64) || base64.Length > 2800000) throw new ArgumentException("Choose a photo smaller than 2 MB.");
        byte[] input;
        try { input = Convert.FromBase64String(base64); } catch (FormatException) { throw new ArgumentException("The photo data is invalid."); }
        if (input.Length > 2 * 1024 * 1024) throw new ArgumentException("Choose a photo smaller than 2 MB.");
        using var data = SKData.CreateCopy(input);
        using var codec = SKCodec.Create(data);
        if (codec == null || codec.EncodedFormat is not (SKEncodedImageFormat.Jpeg or SKEncodedImageFormat.Png) || codec.FrameCount > 1 ||
            codec.Info.Width < 1 || codec.Info.Height < 1 || codec.Info.Width > 2048 || codec.Info.Height > 2048)
            throw new ArgumentException("Choose a JPG or PNG photo up to 2048 × 2048 pixels.");
        using var decoded = SKBitmap.Decode(codec);
        if (decoded == null) throw new ArgumentException("The photo could not be decoded.");
        using var normalized = new SKBitmap(512, 512, SKColorType.Rgba8888, SKAlphaType.Opaque);
        using (var canvas = new SKCanvas(normalized)) {
            canvas.Clear(SKColors.White);
            var size = Math.Min(decoded.Width, decoded.Height);
            var left = (decoded.Width - size) / 2f; var top = (decoded.Height - size) / 2f;
            canvas.DrawBitmap(decoded, new SKRect(left, top, left + size, top + size), new SKRect(0, 0, 512, 512), new SKSamplingOptions(SKFilterMode.Linear));
        }
        // Fresh pixels and explicit JPEG encoding discard original metadata and trailing payloads.
        using var image = SKImage.FromBitmap(normalized);
        using var encoded = image.Encode(SKEncodedImageFormat.Jpeg, 85);
        return encoded.ToArray();
    }
}
