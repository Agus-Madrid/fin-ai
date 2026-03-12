import { execFile as execFileCallback } from 'node:child_process';
import { mkdtemp, readdir, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { promisify } from 'node:util';
import { Injectable } from '@nestjs/common';
import type { DocumentOcrService } from './interfaces/document-ocr-service.interface';
import type { ExtractTextFromPdfInput } from './interfaces/extract-text-from-pdf-input.interface';
import type { ExtractTextFromPdfResult } from './interfaces/extract-text-from-pdf-result.interface';
import type { TesseractCliDocumentOcrOptions } from './interfaces/tesseract-cli-document-ocr-options.interface';

const execFile = promisify(execFileCallback);

@Injectable()
export class TesseractCliDocumentOcrService implements DocumentOcrService {
  readonly providerName = 'tesseract-cli';

  constructor(private readonly options: TesseractCliDocumentOcrOptions) {}

  async extractTextFromPdf(
    input: ExtractTextFromPdfInput,
  ): Promise<ExtractTextFromPdfResult> {
    const workDir = await mkdtemp(join(tmpdir(), 'fin-ai-ocr-'));
    const inputPdfPath = join(workDir, 'input.pdf');
    const imagePrefix = join(workDir, 'page');
    const warnings: string[] = [];

    try {
      await writeFile(inputPdfPath, input.pdfBuffer);

      const converted = await this.convertPdfToPng(
        inputPdfPath,
        imagePrefix,
        warnings,
      );
      if (!converted) {
        return { text: '', warnings };
      }

      const pageImages = await this.listPageImages(workDir);
      if (pageImages.length === 0) {
        warnings.push(
          'OCR fallback could not detect generated page images from the PDF.',
        );
        return { text: '', warnings };
      }

      const textFragments = await this.extractTextFromPageImages(
        workDir,
        pageImages,
        warnings,
      );

      return {
        text: textFragments.join('\n\n').trim(),
        warnings,
      };
    } finally {
      await rm(workDir, { recursive: true, force: true });
    }
  }

  private async convertPdfToPng(
    inputPdfPath: string,
    imagePrefix: string,
    warnings: string[],
  ): Promise<boolean> {
    try {
      await execFile(this.options.pdftoppmBin, [
        '-r',
        String(this.options.dpi),
        '-png',
        inputPdfPath,
        imagePrefix,
      ]);
      return true;
    } catch (error: unknown) {
      warnings.push(this.formatCommandError(error, this.options.pdftoppmBin));
      return false;
    }
  }

  private async listPageImages(workDir: string): Promise<string[]> {
    const files = await readdir(workDir);
    return files
      .filter((filename) => /^page-\d+\.png$/i.test(filename))
      .sort((left, right) => this.comparePageFilenames(left, right));
  }

  private comparePageFilenames(left: string, right: string): number {
    const leftPage = Number(left.match(/^page-(\d+)\.png$/i)?.[1] ?? 0);
    const rightPage = Number(right.match(/^page-(\d+)\.png$/i)?.[1] ?? 0);
    return leftPage - rightPage;
  }

  private async extractTextFromPageImages(
    workDir: string,
    pageImages: string[],
    warnings: string[],
  ): Promise<string[]> {
    const fragments: string[] = [];

    for (const imageFilename of pageImages) {
      const imagePath = join(workDir, imageFilename);
      try {
        const { stdout } = await execFile(this.options.tesseractBin, [
          imagePath,
          'stdout',
          '-l',
          this.options.language,
          '--dpi',
          String(this.options.dpi),
        ]);

        if (stdout?.trim()) {
          fragments.push(stdout.trim());
        }
      } catch (error: unknown) {
        warnings.push(this.formatCommandError(error, this.options.tesseractBin));
        return fragments;
      }
    }

    if (fragments.length === 0) {
      warnings.push('OCR fallback finished but no text was extracted.');
    }

    return fragments;
  }

  private formatCommandError(error: unknown, command: string): string {
    if (!error || typeof error !== 'object') {
      return `OCR command "${command}" failed.`;
    }

    const candidate = error as {
      code?: string;
      message?: string;
      stderr?: string;
    };

    if (candidate.code === 'ENOENT') {
      return `OCR command "${command}" was not found in PATH.`;
    }

    const stderr = candidate.stderr?.trim();
    if (stderr) {
      return `OCR command "${command}" failed: ${stderr}`;
    }

    if (candidate.message) {
      return `OCR command "${command}" failed: ${candidate.message}`;
    }

    return `OCR command "${command}" failed.`;
  }
}
