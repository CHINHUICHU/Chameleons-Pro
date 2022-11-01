## Performance Testing

- ### Two articles comparison

  | Source length | Target length | Avg Server Processing Time (ms) | Avg CPU utilization (%) |
  | ------------- | ------------- | ------------------------------- | ----------------------- |
  | 10000         | 10000         | 294.1                           | 24.5                    |
  | 15000         | 15000         | 196.1                           | 36.8                    |
  | 20000         | 20000         | 324.0                           | 66.0                    |
  | 40000         | 40000         | 385.2                           | 69.7                    |

- ### Multiple articles comparison

  | Article # | Article length | Avg Server Processing Time (ms) | Avg CPU utilization (%) |
  | --------- | -------------- | ------------------------------- | ----------------------- |
  | 5         | 2000           | 258.5                           | 16.6                    |
  | 10        | 2000           | 758.2                           | 36.4                    |
  | 5         | 5000           | 1097.9                          | 56.6                    |
  | 10        | 5000           | 3003.5                          | 78.3                    |
  | 20        | 2000           | 2391.8                          | 62.4                    |
  | 5         | 10000          | 3503.8                          | 86.7                    |

- ### Backgroung information

  - Instance type: 1 \* t3.micro
  - Test case: articles with identical content
  - Number of requests for testing: 10
  - Average server processing time: only calculate the time when the server is processing requests, without data transfer time
  - Average CPU utilization: calculate the average CPU utilization

- ### Result explanation

  - #### Two article comparison

    - Originally, set 40% CPU utilization as threshold to push job into message queue.
    - Compare average request processing time. To enhance user experience, if the article content is longer than 10000 words, trigger the worker to asynchronously process the request.
    - Set 70% of CPU utilization as upper bound to prevent the server from crashing. Therefore, set 40000 words as limit of article content in two article comparison.

          |       | average request processing time (ms)  |

      |-------|---------------------------------------|
      | 10000 | 738.3 |
      | 15000 | 1420.625 |

  - #### Multiple article comparison
    - Currently, multiple artcile comparison does not support asynchronously processing. When user compares 10 articles simultaneously, it takes around 2 seconds to process request. Therefore, set 10 articles and 2000 words of content as upper bound for multiple comparison mode.
