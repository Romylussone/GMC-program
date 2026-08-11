/**
 * Async/Await checkpoint solutions.
 * Run with: node index.js
 */

const delay = (milliseconds) =>
  new Promise((resolve) => setTimeout(resolve, milliseconds));

// Task 01: log each item one second after the preceding item.
async function iterateWithAsyncAwait(values) {
  for (const value of values) {
    console.log(value);
    await delay(1000);
  }
}

// A small API simulation used in Tasks 02–04.
function fakeApiCall(data, shouldFail = false, waitTime = 1000) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (shouldFail) {
        reject(new Error('The API request failed.'));
        return;
      }

      resolve(data);
    }, waitTime);
  });
}

// Tasks 02 and 03: await an API call and present failures clearly.
async function awaitCall(shouldFail = false) {
  try {
    const data = await fakeApiCall({ id: 1, message: 'Data received from the API' }, shouldFail);
    console.log(data);
  } catch (error) {
    console.error('Sorry, we could not load the data. Please try again later.');
  }
}

async function firstAsyncFunction() {
  await delay(1000);
  console.log('First async function finished.');
}

async function secondAsyncFunction() {
  await delay(1000);
  console.log('Second async function finished.');
}

async function thirdAsyncFunction() {
  await delay(1000);
  console.log('Third async function finished.');
}

// Chaining Async/Await: these calls deliberately run one after another.
async function chainedAsyncFunctions() {
  await firstAsyncFunction();
  await secondAsyncFunction();
  await thirdAsyncFunction();
}

// Task 04: start both requests before awaiting either one.
async function concurrentRequests() {
  try {
    const [firstResult, secondResult] = await Promise.all([
      fakeApiCall({ source: 'first API', result: 'First response' }),
      fakeApiCall({ source: 'second API', result: 'Second response' }),
    ]);

    console.log('Combined results:', [firstResult, secondResult]);
  } catch (error) {
    console.error('One of the concurrent requests failed.');
  }
}

// Task 05: fetch every URL at the same time and log parsed JSON responses.
async function parallelCalls(urls) {
  try {
    const responses = await Promise.all(
      urls.map(async (url) => {
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`Request failed for ${url}: ${response.status}`);
        }
        return response.json();
      }),
    );

    console.log('Responses:', responses);
    return responses;
  } catch (error) {
    console.error('Unable to complete all parallel requests:', error.message);
    return null;
  }
}

module.exports = {
  iterateWithAsyncAwait,
  awaitCall,
  chainedAsyncFunctions,
  concurrentRequests,
  parallelCalls,
};

// Demonstration for the offline-safe tasks.
if (require.main === module) {
  (async () => {
    await iterateWithAsyncAwait(['one', 'two', 'three']);
    await awaitCall();
    await chainedAsyncFunctions();
    await concurrentRequests();
  })();
}
