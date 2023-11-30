import "../style.css";

// Constants
const ENDPOINT_COMPLETIONS = "https://api.openai.com/v1/chat/completions";
const ENDPOINT_IMAGES = "https://api.openai.com/v1/images/generations";

// Global variables
let API_KEY;

// Helper functions
async function getBlurb(title, theme) {
  const prompt = `Create a summary (less than 900 characters) of the mangas plot or key features based on the title: "${title}" and theme: "${theme}"`
  const messages = [
    { role: "system", content: "You are an artificial intelligence that generates manga blurbs and covers." },
    { role: "user", content: prompt },
  ];
  const response = await fetch(ENDPOINT_COMPLETIONS, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${API_KEY}`, 
    },
    body: JSON.stringify({
      model: "gpt-3.5-turbo",
      messages: messages,
    }),
  });

  // check for error responses
  if (!response.ok) {
    // print to console for user debugging
    const errorMessage = await response.text(); 
    console.error("Error generating blurb:", errorMessage);
    // throw proper error
    throw new Error("Error when generating blurb");
  }

  const data = await response.json();
  return data.choices[0].message.content; 
}

async function getCoverImage(blurb) {
  const prompt = `Create a cover image for a manga based on this description: ${blurb}`
  const response = await fetch(ENDPOINT_IMAGES, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${API_KEY}`, 
    },
    body: JSON.stringify({ 
      prompt: prompt,
    }),
  });

   // check for error responses
   if (!response.ok) {
    // print to console for user debugging
    const errorMessage = await response.text(); 
    console.error("Error generating cover image:", errorMessage);
    // throw proper error
    throw new Error("Error when generating cover image");
  }

  const data = await response.json();
  return data.data[0].url;
}

async function handleFormSubmission(e) {
  // prevent from reloading
  e.preventDefault();

  // clear previous results
  const blurb_field = document.getElementById("generatedBlurb");
  const cover_image_field = document.getElementById("coverImage");
  blurb_field.classList.add("hidden");
  cover_image_field.classList.add("hidden");

  // get title and theme values
  const title_input = document.getElementById("mangaTitle");
  const title = title_input.value.trim();
  const theme_input = document.getElementById("mangaTheme");
  const theme = theme_input.value.trim();
  const generateButton = document.getElementById("generateButton");

  // disable title and theme inputs and generate button
  title_input.disabled = true;
  theme_input.disabled = true;
  generateButton.disabled = true;
  generateButton.classList.add("hidden");

  // get spinner
  const spinner_field = document.getElementById("spinner");

  // error condition: title or theme wasn't entered
  if (!title || !theme) {
    alert("Please enter both the title and the theme!");
    // reset the fields
    title_input.disabled = false;
    theme_input.disabled = false;
    generateButton.disabled = false;
    generateButton.classList.remove("hidden");
    return;
  }

  try {
    spinner_field.classList.remove("hidden")
    // get blurb and image and set them to the corresponding HTML elements
    const blurb = await(getBlurb(title, theme));
    const image = await(getCoverImage(blurb));
    blurb_field.textContent = blurb;
    cover_image_field.src = image;
    // display HTML elements
    blurb_field.classList.remove("hidden");
    cover_image_field.onload = () => {
      // show cover image
      cover_image_field.classList.remove("hidden");
      // hide spinner and enable input fields
      spinner_field.classList.add("hidden");
      title_input.disabled = false;
      theme_input.disabled = false;
      generateButton.disabled = false;
      generateButton.classList.remove("hidden");
    }
  } catch(e) {
    console.error("Error:", e);
    alert("There was an error in generating the manga");

    // revert fields in case of error
    spinner_field.classList.add("hidden");
    title_input.disabled = false;
    theme_input.disabled = false;
    generateButton.disabled = false;
    generateButton.classList.remove("hidden");
  } 
}

document.addEventListener("DOMContentLoaded", () => {
  API_KEY = localStorage.getItem("openai_api_key");
  // check if an API key as provided, throw alert if not
  if (!API_KEY) {
    alert("Please store your API key in local storage with the key 'openai_api_key'.");
    return;
  }
  const mangaInputForm = document.getElementById("mangaInputForm");
  mangaInputForm.addEventListener("submit", handleFormSubmission);
});
