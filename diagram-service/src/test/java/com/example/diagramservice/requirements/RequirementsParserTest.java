package com.example.diagramservice.requirements;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class RequirementsParserTest {

    private final RequirementsParser parser = new RequirementsParser();

    @Test
    void parsesBoldTitleWithStatusMarkerAndDash() {
        String source = "67. 🚧 **Choisir le niveau de précision** — En tant qu'utilisateur, je veux...";

        var result = parser.parse(source);

        assertThat(result).containsKey("67");
        assertThat(result.get("67").title()).isEqualTo("Choisir le niveau de précision");
        assertThat(result.get("67").description()).isEqualTo("En tant qu'utilisateur, je veux...");
    }

    @Test
    void parsesPlainTitleWithDashNoBold() {
        String source = "1. Connexion utilisateur - permet de se connecter avec email/mot de passe";

        var result = parser.parse(source);

        assertThat(result.get("1").title()).isEqualTo("Connexion utilisateur");
        assertThat(result.get("1").description()).isEqualTo("permet de se connecter avec email/mot de passe");
    }

    @Test
    void parsesTitleOnlyWithoutDescription() {
        String source = "2. Inscription utilisateur";

        var result = parser.parse(source);

        assertThat(result.get("2").title()).isEqualTo("Inscription utilisateur");
        assertThat(result.get("2").description()).isEmpty();
    }

    @Test
    void skipsUnrecognizedLines() {
        String source = """
                # Backlog

                1. Connexion — se connecter
                Some free-text note, not a requirement.
                2. Inscription — créer un compte
                """;

        var result = parser.parse(source);

        assertThat(result).containsOnlyKeys("1", "2");
    }

    @Test
    void lastOccurrenceOfDuplicateIdWins() {
        String source = """
                1. Premier titre — description A
                1. Titre corrigé — description B
                """;

        var result = parser.parse(source);

        assertThat(result).hasSize(1);
        assertThat(result.get("1").title()).isEqualTo("Titre corrigé");
    }
}
