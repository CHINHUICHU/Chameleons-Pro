[![readme-logo (1)](https://user-images.githubusercontent.com/80673666/195984705-fd82a13f-c263-4032-8e08-9ad7a49a6de1.png)](https://chameleons.pro)

# Chameleons-Pro

[CHAMELEONS PRO](https://chameleons.pro) is a Chinese similarity detection system helps users to compare multiple articles simultaneously. The system will calculate similarity between two articles and mark related sentences.

## Content

[Features](#Features)

[Demo](#Demo)

[Tech Stack](#Tech)

[Architechture](#Architechture)

[Algorithm Design](#Algorithm)

[Performance Test](#Performance)

[Test Cases](#Test)

## Features

- Three comparison mode
  - Two articles comparison
  - Multiple articles comparison
  - Upload to compare
- Check history records of the most similar articles in user page
- Support article search with keyword exclusion

## Demo

- Test Account

| Email            | Password |
| ---------------- | -------- |
| test123@test.com | 123      |

- General Case

  - Two Articles Comparison

  - Multiple articles comparison

  - Upload to compare

- Time-comsuming case

  - Two Articles Comparison

  - Multiple articles comparison

  - Upload to compare

- Search Articles

  - Normal case
  - Keyword exclusion

- Check history Records

## Tech Stack

![JavaScript](https://img.shields.io/badge/javascript-%23323330.svg?style=for-the-badge&logo=javascript&logoColor=%23F7DF1E)
![NodeJS](https://img.shields.io/badge/node.js-6DA55F?style=for-the-badge&logo=node.js&logoColor=white)
![Express.js](https://img.shields.io/badge/express.js-%23404d59.svg?style=for-the-badge&logo=express&logoColor=%2361DAFB)
![Socket.io](https://img.shields.io/badge/Socket.io-black?style=for-the-badge&logo=socket.io&badgeColor=010101)

![ElasticSearch](https://img.shields.io/badge/-ElasticSearch-005571?style=for-the-badge&logo=elasticsearch)
![Redis](https://img.shields.io/badge/redis-%23DD0031.svg?&style=for-the-badge&logo=redis&logoColor=white)

![AWS](https://img.shields.io/badge/Amazon_AWS-232F3E?style=for-the-badge&logo=amazon-aws&logoColor=white)
![EC2](https://img.shields.io/badge/EC2-FF9900?style=for-the-badge&logo=amazonec2&logoColor=white)

![jQuery](https://img.shields.io/badge/jquery-%230769AD.svg?style=for-the-badge&logo=jquery&logoColor=white)
![Bootstrap](https://img.shields.io/badge/bootstrap-%23563D7C.svg?style=for-the-badge&logo=bootstrap&logoColor=white)

## Architecture

![image](https://user-images.githubusercontent.com/80673666/195997275-f8252c6b-31c5-44de-b65c-fcf79811b28e.png)

## Algorithm Design

- Articles preprocessing

  - Sentence splitting
  - Tokenization
  - Stop words filtering
  - Synonym identification

- Similarity Calculation

  - Flattern the array of synonym-tagged tokens
  - Use Jaccard Index to calculate the similarity
    <br><img width="321" alt="similarity" src="https://user-images.githubusercontent.com/80673666/195996938-39381a1b-efd8-458a-b03b-6fa4dde8962e.png">

- Related Sentence Indentification
  - Compare number of tokens between two sentences and select larger one as benchmark
  - Define related sentences with the following formula, currently set threshold = 0.5
    <br><img width="321" alt="related sentence" src="https://user-images.githubusercontent.com/80673666/195996989-0e1ce255-eb3b-4a4b-be87-85a71d793ba5.png">

## Performance Test

## Test Cases
