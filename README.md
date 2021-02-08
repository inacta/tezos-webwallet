# Tezos web wallet

This wallet application for Tezos was built using React. It supports multiple wallets (Ledger, Thanos, ...) and allows to interact with the Tezos main and test network. It enables sending transactions, deploying and interacting with smart contracts and sending tokens using the FA1.2 and FA2 standard.

## Dependencies

NodeJS and yarn are required to run this project. Tested with NodeJS v14.15.4 (npm v7.5.2) and yarn v1.22.4.

## Getting Started

1. Clone this repository:

   `git clone https://github.com/inacta/tezos-webwallet`

2. Change your current working directory to the newly cloned repository directory:

   `cd tezos-webwallet`

3. Install dependencies:

   `yarn install`

4. Start development server:

   `yarn start`

5. Open http://localhost:3000 in your browser

_Alternatively_ run `docker build -f Dockerfile .` to build a docker container which will run the wallet at ports 8080 and 443

## Repository overview

This is an overview of the most important components of the web wallet and where to find them.

    ├── public          # React HTML file and assets
    │   ├── assets/img  # images
    ├── src             # React source code
    │   ├── components      # React components
    │   ├── redux           # state management
    │   ├── shared          # libraries shared between multiple components

## Security considerations

This wallet application offers the ability to use plain text private keys as a wallet. While this is fine to use for quick development purposes when using the testnet, it is strongly discouraged to use this wallet method for mainnet or whenever funds are at risk. In this case use one of the other encrypted alternatives.

This project is licensed under the terms of the MIT license.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
