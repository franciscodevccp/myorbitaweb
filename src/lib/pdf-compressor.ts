import { execFile } from "child_process";
import { stat } from "fs/promises";
import { promisify } from "util";
import path from "path";

const execFileAsync = promisify(execFile);

const GS_COMMAND = process.platform === "win32" ? "gswin64c" : "gs";

export async function compressPdf(
  inputPath: string,
  outputPath: string
): Promise<{
  success: boolean;
  originalSize: number;
  compressedSize: number;
}> {
  const originalStat = await stat(inputPath);
  const originalSize = originalStat.size;

  try {
    await execFileAsync(GS_COMMAND, [
      "-sDEVICE=pdfwrite",
      "-dCompatibilityLevel=1.4",
      "-dPDFSETTINGS=/ebook",
      "-dNOPAUSE",
      "-dBATCH",
      "-dQUIET",
      "-dColorImageResolution=150",
      "-dGrayImageResolution=150",
      "-dMonoImageResolution=300",
      `-sOutputFile=${outputPath}`,
      inputPath,
    ]);

    const compressedStat = await stat(outputPath);
    const compressedSize = compressedStat.size;

    if (compressedSize >= originalSize) {
      return { success: false, originalSize, compressedSize: originalSize };
    }

    return { success: true, originalSize, compressedSize };
  } catch (error) {
    console.error("[Compressor] Error:", error);
    return { success: false, originalSize, compressedSize: originalSize };
  }
}
