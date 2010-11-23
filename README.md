# Javascript Text Indexer
Javascript implementation of a text indexer that scans the given text content for email address, URLs, phone numbers, and emoticons.

## Usage
    TextIndexer.run(string)
  Executes the indexer on string, returning the text with all linkable content replaced with anchors or images.

Under webOS Mojo applications this library will replace the system defined `Mojo.Format.runTextIndexer`. If this behavior is not desired then these lines should be removed:

    // Mojo Framework override. Unused on non-Mojo platforms and may be removed if undesired in Mojo apps
    if (window.Mojo && Mojo.Format) {
        // Override the Mojo API if it exists in this context.
        Mojo.Format.runTextIndexer = runTextIndexer;
    }

## Warning
This method is not HTML aware. Passing content that contains existing HTML elements could produce invalid HTML. Callers should scrub HTML content before displaying.

## Notes
As processing human-generated content can be somewhat complex and have ambiguous meaning this indexer generally attempts to take a more conservative route when deciding to replace content. That being said if there are cases where the content is not properly linked please file an issue within this github repository.
