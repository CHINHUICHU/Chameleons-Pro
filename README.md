[![readme-logo (1)](https://user-images.githubusercontent.com/80673666/195984705-fd82a13f-c263-4032-8e08-9ad7a49a6de1.png)](https://chameleons.pro)

# Chameleons-Pro

[CHAMELEONS PRO](https://chameleons.pro) is a Chinese similarity detection system helps users to compare multiple articles simultaneously. The system will calculate similarity between two articles and mark related sentences.

## Content

[Features](#Features)

[Test Account](#test-account)

[Algorithm Design](#Algorithm-design)

[Architechture](#architechture)

[Demo](#Demo)

[Tech Stack](#Tech-stack)

[Contact](#Contact)

## Features

- Three comparison mode
  - Two articles comparison
    The system compares source and target articles and return similarity and similar sentences.
  - Multiple articles comparison
    When the number of articles > 2, the system compares each pair of articles.
  - Upload to compare
    Users upload 1 article and the system search articles in database to conduct analysis
- Check history records
- Support article search with keyword exclusion

## Test Account

- Test Account

| Email            | Password |
| ---------------- | -------- |
| test123@test.com | 123      |

## Algorithm Design

- ### Articles preprocessing

![image](https://user-images.githubusercontent.com/80673666/198678555-b9f1bea6-e846-4986-8a85-18568cc1f050.png)
![image](https://user-images.githubusercontent.com/80673666/198678618-34009ce6-97ed-4886-aaa9-8b509aba56fd.png)

- #### Sentence splitting
  <p>Articles are split by common punctuation marks in Chinese, e.g. ，, \n, ！, ？, ：, ；, .etc. The output is an array of sentences, the punctuation marks are preserved for frontend result display.</p>
- #### Tokenization
  <p>Jieba is used for tokenizing each sentence, and sentences become a set of tokens. The output returns a 2D array.</p>
- #### Stop words filtering
  <p>A stop word table is built when the server starts running. Tokens are filtered if it exists in the table.</p>
- #### Synonym identification
  <p>A synonym map is built based on a pre-defined dictionary. Synonyms have the same keys in the table. Semantically similar tokens are replaced with the same tag.</p>
- #### Keyword extraction
  <p>Before storing articles in the database, Jieba is used for extracting keywords of articles. Keywords are used for upload to compare mode. Possible similar articles are selected based on tags rather than the full text. The number of keywords is based on the length of the article.</p>
- #### Example

  <br>![preprocess](https://user-images.githubusercontent.com/80673666/198674272-caa98ecc-6cb0-4521-8c09-ae63cbe36a86.gif)

- ### Similarity Calculation

![image](https://user-images.githubusercontent.com/80673666/198618584-69602804-eba5-4f36-9c53-43b96b9e92b7.png)

- INPUT: two 2D arrays represent preprocessed articles OUTPUT: the similarity score
- First, flatten the array of synonym-tagged tokens into a 1D array because similarity calculation is only based on tokens rather than sentences.
- Second, use Jaccard Index to calculate the similarity. Tokens of articles are added into sets. Duplicate tokens are viewed as one token. The similarity is evaluated by the intersection of sets divided by the union of sets.
  <br><img width="321" alt="similarity" src="https://user-images.githubusercontent.com/80673666/195996938-39381a1b-efd8-458a-b03b-6fa4dde8962e.png">
- Example
  <br><img width="701" alt="similarty calculation" src="https://user-images.githubusercontent.com/80673666/198675792-0aa50191-f51d-46a4-a7c0-26d76aff918f.png">

- ### Related Sentence Indentification

  - INPUT: two 1D arrays represent sets of tokens. OUTPUT: two arrays of sentence indices represent sentences that have related one(s) in the other article
  - Decide which sentence should be the benchmark by comparing the number of processed tokens of two sentences and choose the larger one.
  - Add tokens of the benchmark into the set first. And examine tokens of the other sentence with the set to count matched ones.
  - If the number of matched tokens is more than half of the benchmark set's size, identify two sentences that are similar and return sentence indices.
    <br><img width="321" alt="related sentence" src="https://user-images.githubusercontent.com/80673666/195996989-0e1ce255-eb3b-4a4b-be87-85a71d793ba5.png">
  - Matched sentence example
    <br><img width="741" alt="result" src="https://user-images.githubusercontent.com/80673666/198858830-d8ad319d-4efc-4759-9401-0406e809a68d.png">
  - Explanation
  <p>「此領域探討如何處理及運用自然語言」 and 「自然語言處理包括很多方面和步驟」 have 5 mathced tokens out of 6 </p>
  <p>「自然語言處理包括多方面和步驟」 and 「此領域探討如何處理及運用自然語言」have 3 matched tokens out of 6 </p>

## Architecture

- ### Main system architecture
  ![image](https://user-images.githubusercontent.com/80673666/198864855-39eedc42-7f7e-4269-8dfa-bd9ca36da704.png)
  - NGINX is used as reverse proxy, it redirects requests from port 80 to the port that the server runs. The server is on AWS EC2, and saves processed result to Elasticsearch. This is the general case when the request can be quickly finished without blocking the server.
- ### Message queue design

  ![image](https://user-images.githubusercontent.com/80673666/198865416-b2d5d124-4160-46f8-8462-d8da700943bc.png)

  - When the server detects the request may take longer time to process, it will push the job into a message queue. The message queue is built with Redis.
  - The worker constantly check if there are jobs in queue and pop job to process. List is used to implement the queue over the sorted set since pop and push only take O(1) and the order of request do not need to be guaranteed.
  - When the worker finish job, it will notify the server by publishing message to a Redis channel. The server will send result to clients after receiving message from the worker.

## Demo

- Two Articles Comparison

![ezgif com-gif-maker](https://user-images.githubusercontent.com/80673666/196016943-97edaa34-7e24-4827-b6b8-67cd8bd629bb.gif)

- Multiple articles comparison

![mutiple](https://user-images.githubusercontent.com/80673666/196017731-2e9bf7f3-0eea-449a-a4b8-549e8c6ee035.gif)

- Upload to compare

![upload](https://user-images.githubusercontent.com/80673666/196017273-62e38bda-facb-4efc-9d5e-7f02bd3826c7.gif)

- Time-comsuming case (content > 3,000 words)

![socket](https://user-images.githubusercontent.com/80673666/196049628-0f429f31-656c-4ac3-8616-7d8551f3eeb9.gif)

- Check history Records

![user](https://user-images.githubusercontent.com/80673666/196018748-6712a330-bca6-493c-bede-b1282ecef4a9.gif)

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

## Contact

- [LinkedIn](https://www.linkedin.com/in/jimmychc/)
- [Email](mailto:jimmychu021@gmail.com)
