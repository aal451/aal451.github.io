const segmentButton = document.getElementById("segment-button");
segmentButton.addEventListener("click", segment);

const demoButton = document.getElementById("demo-button");
demoButton.addEventListener("click", triggerDemo);

function segment() {
    /**
     * Segment the inputted Chinese text, then display that segmentation in the output area so the user can begin clicking to look up
     */
    const chineseInputText = document.getElementById("chinese-input-text").value;

    // call our custom API to get the segmentation of the text, then display the resulting segmentation in the output area.
    const apiURL = "https://chinese-tools-api.vercel.app";
    // Note: we need to manually encode the characters during the API call to preserve the newlines from the input text so they can appear in the outputted segmentation too.
    fetch(apiURL + "/segment/" + encodeURIComponent(chineseInputText))
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
        // add the result of the segmentation to the output area.
        .then(segmentationResult => {
            
            const segmentationOutputArea = document.getElementById("segmentation-output-area");

            // remove existing segmentations from the output area if present so we can replace it with this new segmentation.
            segmentationOutputArea.replaceChildren();

            // add each word in the segmentation to the output area
            for(let i = 0; i < segmentationResult.length; i++){
                const wordToAddFromSegmentation = segmentationResult[i];

                const anchorNeededToWrapWord = document.createElement("a");
                anchorNeededToWrapWord.innerText = wordToAddFromSegmentation + " ";
                anchorNeededToWrapWord.id = 'word-' + i;

                // attach a listener to each word so that when the word is clicked, we can retrieve and display its definition.
                anchorNeededToWrapWord.addEventListener("click", defineWord);

                // add tabindex so the dismissable popups generated on the tag later will render properly 
                // reference: https://getbootstrap.com/docs/5.3/components/popovers/#dismiss-on-next-click
                anchorNeededToWrapWord.tabIndex = 0;

                // makes sure the "   " separating each word will actually render correctly in the HTML
                anchorNeededToWrapWord.style.whiteSpace = "pre-wrap";

                segmentationOutputArea.append(anchorNeededToWrapWord);
            }

            // display the result of the segmentation to the user (output area is hidden in the beginning).
            document.getElementById("output-section").style.visibility = "visible";
        });
}

function defineWord(event) {
    /**
     * Retrieve the definition of the word contained in event.target, then display a popup with that definition above the word for the user to see.
     */
    const wordToDefine = event.target.innerText;

    // call our custom API to get the definition of the word to define, then display the resulting definition in the click-to-lookup popup.
    const apiURL = "https://chinese-tools-api.vercel.app";

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
            return response.text();
        })
        .then(definitionResult => {

            // remove any existing popovers (ensures definition popovers will not overlap, which would be annoying)
            document.querySelectorAll(".popover").forEach(popover => { popover.remove()});

            // generate and attach the definition popup to the element (in this case, event.target) containing the word.
            const definitionPopup = new bootstrap.Popover("#"+event.target.id, {
                content: definitionResult,
                trigger: 'focus',
                placement: 'top',
                customClass: 'force-whitespace-on-definition override-popup-max-width-constraints'
            });

            // show the definition to the user.
            definitionPopup.show();
        });
}

function triggerDemo(){
    /**
     * Populate the input text field with some example text and segment it, providing the user a quick demo of the tool's functionality.
     */

    const exampleChineseText = "我喜欢吃蛋糕，所以昨天我买了三个蛋糕来吃";
    document.getElementById("chinese-input-text").value = exampleChineseText;
    segment();
}