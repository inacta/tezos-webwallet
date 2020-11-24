package ch.dsent.maven;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

/**
 * Custom schema generator for ddl-scripts. This class uses directly hibernate schema generation.
 *
 * @author inacta AG
 * @since 1.0.0
 */
@SuppressWarnings("java:S3740")
public class BeforeUIBuild {

    /**
     * Executes Schema generation
     *
     * @param args
     *            [0] = package of entity classes [1] = path where to write output file
     * @param args
     * @throws IOException
     *             thrown if sth. happen
     */
    public static void main(final String[] args) throws IOException {
        Path path = Paths.get("src/App.tsx");
        String newFile = Files.readString(path).replace("@@@_VERSION_@@@", args[0]);
        Files.writeString(path, newFile);
        System.exit(0);
    }

}