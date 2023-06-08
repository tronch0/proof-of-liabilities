# Proof-of-Liabilities
This repository contains an implementation of the Proof-of-Liabilities protocol, as described by Greg Maxwell and Zak Wilcox. This protocol allows cryptocurrency exchanges and wallet sites to prove that they hold the assets they claim to, without revealing too much about their customers.

## Background
Given the historical tendency of exchanges/wallet sites to be suspected of holding only a fraction of customers' Bitcoin, it's becoming important for customers of these sites to be able to verify these sites really hold the bitcoins they claim to. This can be achieved using a Merkle tree-based technique, which is what this implementation provides.

## How It Works
The Proof-of-Liabilities protocol uses a Merkle tree to prove liabilities. Each leaf of the tree represents a customer account, with a hash computed over the account's balance and a nonce. The tree is then constructed such that each internal node is a sum of its children's balances, and a hash of its children's hashes.

When a customer wants to verify their balance, they are given a path from their leaf to the root of the tree. They can then verify that their balance is included in the total liabilities by checking the hashes and sums along this path.

## Limitations
This system only works if a significant proportion of customers regularly carry out the check they're empowered to perform. It doesn't aim to give a customer a way to make a verifiable public complaint about a disagreement between them and a competently evil exchange. It merely gives you the means check your own belief of the exchange’s liability/obligation to you is included in their publicly declared one, and to let you make an informed decision about whether to continue doing business with them if those numbers differ.

## Usage
This repository provides a library for constructing and verifying Merkle trees for the Proof-of-Liabilities protocol. See the included example code for how to use this library.
### Run
Run the following commands in the root dir
1. `npm install`
2. `npm run build`
3. `npm start`

## References
For more information about the Proof-of-Liabilities protocol, see the following resources:
- ([Proving Bitcoin Reserves](https://web.archive.org/web/20170114112433/https://iwilcox.me.uk/2014/proving-bitcoin-reserves)) by Zak Wilcox
- ([Nic Carter's PoR website](https://web.archive.org/web/20170114112433/https://iwilcox.me.uk/2014/proving-bitcoin-reserves))

Proof of Liabilities (PoL) is an idea initially described by Greg Maxwell.
([source]([https://web.archive.org/web/20170114112433/https://iwilcox.me.uk/2014/proving-bitcoin-reserves](https://niccarter.info/proof-of-reserves/)))


