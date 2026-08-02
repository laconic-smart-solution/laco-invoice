package com.laconic.lacoinvoice.common.export;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.LinkedHashSet;
import java.util.Set;
import java.util.zip.ZipEntry;
import java.util.zip.ZipOutputStream;

import com.laconic.lacoinvoice.common.exception.BusinessRuleException;

public final class ZipExportWriter {

	private ZipExportWriter() {
	}

	public static byte[] write(Iterable<ZipFileEntry> entries) {
		try (ByteArrayOutputStream out = new ByteArrayOutputStream();
				ZipOutputStream zip = new ZipOutputStream(out)) {
			Set<String> usedNames = new LinkedHashSet<>();
			for (ZipFileEntry entry : entries) {
				String name = uniqueName(entry.filename(), usedNames);
				zip.putNextEntry(new ZipEntry(name));
				zip.write(entry.content());
				zip.closeEntry();
			}
			zip.finish();
			return out.toByteArray();
		} catch (IOException ex) {
			throw new BusinessRuleException("Unable to build ZIP archive.");
		}
	}

	private static String uniqueName(String filename, Set<String> usedNames) {
		String base = filename == null || filename.isBlank() ? "file" : filename;
		if (usedNames.add(base)) {
			return base;
		}
		int dot = base.lastIndexOf('.');
		String stem = dot > 0 ? base.substring(0, dot) : base;
		String ext = dot > 0 ? base.substring(dot) : "";
		int index = 2;
		String candidate;
		do {
			candidate = stem + "-" + index + ext;
			index++;
		} while (!usedNames.add(candidate));
		return candidate;
	}

	public record ZipFileEntry(String filename, byte[] content) {
	}
}
