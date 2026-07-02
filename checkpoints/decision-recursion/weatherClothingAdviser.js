const readline = require("readline");

function getClothingAdvice(temperature, isRaining) {
  let advice;

  if (temperature < 10) {
    advice = "Wear a warm coat, a sweater, and long pants";
  } else if (temperature < 20) {
    advice = "Wear a jacket or hoodie with long pants";
  } else if (temperature < 30) {
    advice = "Wear a light shirt and comfortable pants";
  } else {
    advice = "Wear light clothes, such as shorts and a T-shirt";
  }

  if (isRaining) {
    advice += ", and take an umbrella or raincoat";
  }

  return advice + ".";
}

function askQuestion(question, rl) {
  return new Promise((resolve) => {
    rl.question(question, resolve);
  });
}

async function main() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const temperatureInput = await askQuestion("What is the current temperature in Celsius? ", rl);
  const rainInput = await askQuestion("Is it raining? (yes/no) ", rl);

  const temperature = Number(temperatureInput);
  const isRaining = rainInput.trim().toLowerCase() === "yes";

  if (Number.isNaN(temperature)) {
    console.log("Please enter a valid number for the temperature.");
  } else {
    console.log(getClothingAdvice(temperature, isRaining));
  }

  rl.close();
}

if (require.main === module) {
  main();
}

module.exports = getClothingAdvice;
