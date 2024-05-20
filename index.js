const segmentButton = document.getElementById("segment-button");
segmentButton.addEventListener("click", segment);

function segment() {
    /**
     * Segment the inputted Chinese text, then display that segmentation in the output area so the user can begin clicking to look up
     */
    const chineseInputText = document.getElementById("chinese-input-text").value;

    // call our custom API to get the segmentation of the text, then display the resulting segmentation in the output area.
    const apiURL = "https://chinese-tools-api.vercel.app";
    fetch(apiURL + "/segment/" + chineseInputText)
        .then(response => {
            if (!response.ok) {
                if (response.status === 500) {
                    throw new Error("Server Error");
                }
                else {
                    throw new Error("An error occurred while attempting to fetch the segmentation of the input text.")
                }
            }
            return response.json()
        })
        .then(segmentationResult => {
            // add the result of the segmentation to the output area.
            const segmentationOutputArea = document.getElementById("segmentation-output-area");
            segmentationResult.forEach(function (wordInSegmentation) {
                
                // words are passed back from API in percent encoding, so convert words back to characters.
                wordInSegmentation = decodeURIComponent(wordInSegmentation); 

                const spanNeededToWrapWord = document.createElement("span");
                spanNeededToWrapWord.innerText = wordInSegmentation;

                // attach a listener to each word so that when the word is clicked, we can retrieve and display its definition.
                spanNeededToWrapWord.addEventListener("click", defineWord);
                segmentationOutputArea.append(spanNeededToWrapWord);
            });

            // display the result of the segmentation to the user (output area is hidden in the beginning).
            document.getElementById("segmentation-output-area").style.visibility = "visible";
        });
}

function defineWord(event) {
    /**
     * Retrieve the definition of the word contained in event.target, then display a popup with that definition above the word for the user to see.
     */
    const wordToDefine = event.target.value;

    // call our custom API to get the definition of the word to define, then display the resulting definition in the click-to-lookup popup.
    const apiURL = "https://chinese-tools-api.vercel.app";
    let definitionResult = "";
    fetch(apiURL + "/define/" + wordToDefine)
        .then(response => {
            if (!response.ok) {
                if (response.status === 500) {
                    throw new Error("Server Error");
                }
                else {
                    throw new Error("An error occurred while attempting to fetch the segmentation of the input text.")
                }
            }
            definitionResult = response.text();
        })
        .then(definitionResult => {
            // generate and attach the definition popup to the element (in this case, event.target) containing the word.
            const definitionPopup = bootstrap.getOrCreateInstance(event.target.id, {
                "content": definitionResult,
                "trigger": 'focus'
            });

            // show the definition to the user.
            definitionPopup.show();
        });
}

