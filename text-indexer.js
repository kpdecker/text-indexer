var TextIndexer;

(function() {
    // If we are on a device that supports the emoticon replacement then emoticons will be replaced as well.
    // Note that at this time this is limited to webOS devices when run as an application.
    var EMOTICON_REGEX = /(\s|^)((?:\:[a-z]+)|(?:[>oO]?[:;8B%xX=]['\-]?[oO()\[\]$Ss!D&@\\\/Ppb*>|])|(?:[o\^][\-_]?[O\^])|(?:<3))(\s|$)/gm;
    var emoticonCache = {};
    function runEmoticonIndexer(text) {
        // Only do emoticon conversion if we have the base impl
        if (!window.PalmSystem || !window.PalmSystem.runTextIndexer) {
            return text;
        }

        return text.replace(EMOTICON_REGEX, function(match, start, str, end) {
            if (!emoticonCache[str]) {
                emoticonCache[str] = window.PalmSystem.runTextIndexer(str.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;"));
            }
            return start + (emoticonCache[str] || str) + end;
        });
    }

    // Kind of ugly, but this is much faster than the default indexer implementation (for a sampling of facebook data)
    // There are three segments to this regex:
    //    URL: \b(?:https?:\/\/|mms:\/\/|app:\/\/|www\.)(?:[a-z0-9\-._~!$&'()*+,;=:@\/]|%[0-9a-f]{2})+(?:\?(?:[a-z0-9\-._~!$&'()*+,;=:@\/?]|%[0-9a-f]{2})*)?(?:#(?:[a-z0-9\-._~!$&'()*+,;=:@\/?]|%[0-9a-f]{2})*)?
    //      Fairly relaxed (particularly for the first segments of urls) URL matcher
    //
    //    Email: (?:mailto\:)?[a-z0-9!#$%&'*+!\/=?\^_`{|}~]+@[a-z0-9\-.]+
    //
    //    Phone: (?:tel\:)?([ \t()+*\-#.]*[0-9]){6,16}
    var INDEXER_REGEX = /(\b(?:https?:\/\/|mms:\/\/|app:\/\/|www\.)(?:[a-z0-9\-._~!$&'()*+,;=:@\/]|%[0-9a-f]{2})+(?:\?(?:[a-z0-9\-._~!$&'()*+,;=:@\/?]|%[0-9a-f]{2})*)?(?:#(?:[a-z0-9\-._~!$&'()*+,;=:@\/?]|%[0-9a-f]{2})*)?)|((?:mailto\:)?[a-z0-9!#$%&'*+!\/=?\^_`{|}~]+@[a-z0-9\-.]+)|((?:tel\:)?([ \t()+*\-#.]*[0-9]){6,16})/ig;

    function runLinkIndexer(text) {
        return text.replace(INDEXER_REGEX, function(str, url, email, phone) {
            var prefix = "";
            if (email && email.indexOf("mailto:") === -1) {
                prefix = "mailto:";
            } else if (phone && phone.indexOf("tel:") === -1) {
                prefix = "tel:";

                // This code borrows heavily from the base indexer impl
                // We now apply heuristics to the candidate sequence.
                var digit_count = phone.replace(/[^0-9]/g, '').length,
                    plus_prefix = phone.search(/^[ \t]*\+/) === 0;
                if (digit_count > 12 && !plus_prefix) {
                    return str;    // this could be a zip code or a PBX extension
                } else if (digit_count === 9 && /^[ \t]*[0-9]{5}[ -+][0-9]{4}$/.test(phone)) {
                    return str;   // this is likely a zip+4 zip code in either "5 4" or "5-4" format
                } else if ((digit_count === 8 || digit_count === 9) && phone.search(/[ -.]/) === -1 && !plus_prefix) {
                    return str;    // If more than a 7 digit phone number delimiter or '+' prefix is not present
                } else if ((digit_count === 7 || digit_count === 8) && /^[ \t]*[0-9]{0,4}[ \/\-.][0-9]{0,4}[ \/\-.][0-9]{0,4}$/.test(phone)) {
                    return str;   // reject common dates case (like xx/xx/xxxx)
                } else if (digit_count === 6 && !/^[ \t]*[0-9]{3} [0-9]{3}$/.test(phone)) {
                    return str;   // only accept "3 3" format numbers for Norway
                } else if (/^[ \t]*(?:-[0-9]*\.?)|(?:[0-9]*\.)[0-9]*$/.test(phone)) {
                    return str;   // this could be a decimal or negative number
                }
            } else if (url && url.indexOf("://") === -1) {
                prefix = "http://";
            }
            return "<a href=\"" + prefix + str + "\">" + str + "</a>";
        });
    }

    TextIndexer = {
        /**
         * Scans a given text block for email addresses, phone numbers, urls, and emoticons.
         * Any content will be replaced with a HTML anchor or image element.
         * 
         * Note that emoticon support is dependent on platform support and may not be available
         * in all environments.
         *
         * WARN: This method is not HTML aware. Passing content that contains existing HTML elements
         * could produce invalid HTML. Callers should scrub HTML content before displaying.
         */
        run: function runTextIndexer(text) {
            text = runEmoticonIndexer(text);
            text = runLinkIndexer(text);
            return text;
        }
    };

    // Mojo Framework override. Unused on non-Mojo platforms and may be removed if undesired in Mojo apps
    if (window.Mojo && Mojo.Format) {
        // Override the Mojo API if it exists in this context.
        Mojo.Format.runTextIndexer = TextIndexer.run;
    }
})();