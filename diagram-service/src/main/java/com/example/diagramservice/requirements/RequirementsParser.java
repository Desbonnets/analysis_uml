package com.example.diagramservice.requirements;

import org.springframework.stereotype.Component;

import java.util.LinkedHashMap;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Minimal parser for a user-supplied requirements backlog, used by the test-coverage check
 * (TestCoverageService) as the "reference" side to diff detected tests against — same role
 * PlantUmlParser plays for the conformance check.
 *
 * Format, one requirement per line (multi-line descriptions are out of scope for v1):
 *   "67. **Title** — description"   (bold and " — "/" - " separator both optional)
 *   "67. Title — description"
 *   "67. Title"
 * A leading run of non-alphanumeric characters right after "N." (a status marker, e.g.
 * "67. 🚧 **Title** — ...", the convention already used by this repo's own USER_STORIES.md)
 * is stripped before looking for the bold title, so pasting straight from that convention
 * works unmodified. Lines not matching "N. ..." are skipped — same low-ceremony,
 * regex/line-by-line style as PlantUmlParser.
 */
@Component
public class RequirementsParser {

    private static final Pattern LINE_RE = Pattern.compile("^\\s*(\\d+)\\.\\s*(.*)$");
    private static final Pattern BOLD_TITLE_RE = Pattern.compile("^\\*\\*(.+?)\\*\\*\\s*(?:[—-]\\s*(.*))?$");
    private static final Pattern SEPARATOR_RE = Pattern.compile("\\s+[—-]\\s+");

    public Map<String, ParsedRequirement> parse(String source) {
        Map<String, ParsedRequirement> requirements = new LinkedHashMap<>();

        for (String line : source.split("\\r?\\n")) {
            Matcher lm = LINE_RE.matcher(line);
            if (!lm.find()) continue;

            String id = lm.group(1);
            String rest = lm.group(2).replaceFirst("^[^\\p{L}\\p{N}*]+", "");

            String title;
            String description;
            Matcher bm = BOLD_TITLE_RE.matcher(rest);
            if (bm.matches()) {
                title = bm.group(1).trim();
                description = bm.group(2) != null ? bm.group(2).trim() : "";
            } else {
                Matcher sepMatcher = SEPARATOR_RE.matcher(rest);
                if (sepMatcher.find()) {
                    title = rest.substring(0, sepMatcher.start()).trim();
                    description = rest.substring(sepMatcher.end()).trim();
                } else {
                    title = rest.trim();
                    description = "";
                }
            }

            requirements.put(id, new ParsedRequirement(id, title, description));
        }

        return requirements;
    }

    public record ParsedRequirement(String id, String title, String description) {
    }
}
