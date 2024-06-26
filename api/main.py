import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import PlainTextResponse

import jieba
from chinese_english_lookup import Dictionary
import textwrap
import urllib

app = FastAPI()

origins = ['https://aal451.github.io']
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root() -> None:
    """
    Let user know that the only valid API routes are /segment/ and /define/ should they try to call /.

    Parameters:
    -----------
        None

    Returns:
    --------
        None

    """
    return {"message": "Invalid Request - to request segmentation, use /segment/(chinese text to segment), to request definitions, use /define/(chinese word to define)"}


@app.get("/segment/{text_to_segment}")
async def segment_input_chinese_into_words(text_to_segment: str) -> list[str]:
    """
    Given a string of Chinese text, use the jieba library to segment the text into its individual words, returning the resulting segmentation as a list.

    Parameters:
    -----------
        text_to_segment: str
            A string representing the Chinese text we want to segment into its individual words.

    Returns:
    --------
        A list of strings, where each string represents an individual word that made up text_to_segment. Words in the list are in the same order as they appeared in text_to_segment. 
    """
    # Need to convert the percent encoding the URL passes back into UTF-8, otherwise segmentation will fail.
    text_to_segment = urllib.parse.unquote(text_to_segment)

    return jieba.lcut(text_to_segment)


@app.get("/define/{chinese_word_to_define}", response_class=PlainTextResponse)
async def get_definition_of_chinese_word(chinese_word_to_define: str) -> str:
    """
    Given a Chinese word to lookup, return a nicely formatted string representing the definition of the word using definition data from the chinese_english_lookup tool.

    Parameters:
    -----------
        chinese_word_to_define: str
            A string representing the Chinese word to define.

    Returns:
    --------
        A string representing chinese_word_to_define's definition, formatted like so:

        Definition:
          Simplified:  (chinese_word_to_define written in simplified characters)
          Traditional: (chinese_word_to_define written in traditional characters)

          1) (phonetic (pinyin) representation of the word when the word means this definition) (definition of the word)
          2) (phonetic (pinyin) representation of the word when the word means this definition) (definition of the word)
          ... and so on until all available definitions are provided
        
        Note: if no definition for the word determined by segmentation can be found in the dictionary, we return a string that lists out a definition entry (in the format above) for each character of the word to help the user piece together the word's definition (we let the user know if we can't find a character too).
    """

    # Need to convert the percent encoding the URL passes back into UTF-8, otherwise dictionary lookup will fail.
    chinese_word_to_define = urllib.parse.unquote(chinese_word_to_define) 

    chinese_english_dictionary = Dictionary()
    dictionary_lookup_result = chinese_english_dictionary.lookup(
        chinese_word_to_define)

    # can't find word in the dictionary case
    if dictionary_lookup_result is None:
        definition_string_to_return = ""
        for character in chinese_word_to_define:
            dictionary_lookup_result = chinese_english_dictionary.lookup(character)

            # if we can't find the character (very unlikely), leave a note for the user
            if dictionary_lookup_result is None:
                definition_string_to_return += "Unfortunately, " + character + " could not be found in the dictionary, as it is not in the dictionary. Sorry for the inconvenience!" + "\n\n"
                continue
                
            definition_string_to_return += (
                "Definition: \n"
                + "  Simplified:  " + dictionary_lookup_result.simp + "\n"
                + "  Traditional: " + dictionary_lookup_result.trad + "\n"
                + "  \n"
                + textwrap.indent(dictionary_lookup_result.get_definition_entries_formatted(), "  ") + "\n\n"
            )
        return definition_string_to_return
        


    definition_string_to_return = (
        "Definition: \n"
        + "  Simplified:  " + dictionary_lookup_result.simp + "\n"
        + "  Traditional: " + dictionary_lookup_result.trad + "\n"
        + "  \n"
        + textwrap.indent(dictionary_lookup_result.get_definition_entries_formatted(), "  ")

    )

    return definition_string_to_return


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
