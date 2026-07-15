# Intuition

The H-Index is a metric that measures both the productivity and citation impact of a researcher. An index of $h$ means the researcher has published $h$ papers that have each been cited at least $h$ times.

To find the H-Index, we can start with a basic linear search testing each possible value of $h$. We can improve this using sorting, and finally optimize to linear time complexity using a frequency array (bucket sort concept).

---

# Approach 1: Brute Force (Linear Search)

1. Test every possible value of $h$ from $0$ up to $n$ (the total number of papers).
2. For each $h$, use a helper function `isPossibleIndex` to count how many papers have at least $h$ citations.
3. If the count of papers with citations $\ge h$ is greater than or equal to $h$, then $h$ is a valid H-Index candidate.
4. Keep track of the highest valid $h$ found.

# Complexity

* Time complexity:

$$O(n^2)$$

Where:
* `n` = number of papers. We iterate through $h$ from $0$ to $n$, and for each $h$ we perform a full scan of the `citations` array.

* Space complexity:

$$O(1)$$

Since we only use a few helper variables for tracking counts and answers.

# Code

```java
class Solution {

    public boolean isPossibleIndex(int[] citations, int h) {
        int count = 0;

        for (int c : citations) {
            if (c >= h) count++;
        }

        return count >= h;
    }

    public int hIndex(int[] citations) {
        int n = citations.length;
        int ans = 0;

        for (int h = 0; h <= n; h++) {
            if (isPossibleIndex(citations, h)) {
                ans = h;
            }
        }

        return ans;
    }
}
```

---

# Approach 2: Sorting

1. Sort the `citations` array in ascending order.
2. If the array is sorted, at any index `i`, we know that all papers from index `i` to `n - 1` have at least `citations[i]` citations.
3. The number of such papers is `h = n - i`.
4. If `citations[i] >= h`, it means we have found at least `h` papers with at least `h` citations. Since we check from left to right, the first index `i` that satisfies this condition gives the maximum possible H-Index (`h = n - i`).
5. If no such index is found, the H-Index is `0`.

# Detailed Dry Run

Let's dry run the sorting approach with:
- `citations` = `[3, 0, 6, 1, 5]`

1. Sort the array: `citations` = `[0, 1, 3, 5, 6]`, $n = 5$

| Index $i$ | Citations `citations[i]` | Papers with $\ge$ citations (`h = n - i`) | Is `citations[i] >= h`? | Return Value | Notes |
| :---: | :---: | :---: | :---: | :---: | :--- |
| **0** | 0 | $5 - 0 = 5$ | $0 \ge 5$ (False) | - | Not enough citations for 5 papers. |
| **1** | 1 | $5 - 1 = 4$ | $1 \ge 4$ (False) | - | Not enough citations for 4 papers. |
| **2** | 3 | $5 - 2 = 3$ | $3 \ge 3$ (True) | **3** | Returns `3` immediately. |

**Final Answer:** `3`

# Complexity

* Time complexity:

$$O(n \log n)$$

Where:
* `n` = number of papers. The most expensive operation is sorting the array, which takes $O(n \log n)$ time. The subsequent scan takes $O(n)$ time.

* Space complexity:

$$O(1)$$ (or $O(n)$ depending on the sorting implementation's memory overhead).

# Code

```java
import java.util.Arrays;

class Solution {
    public int hIndex(int[] citations) {
        Arrays.sort(citations);

        int n = citations.length;

        for (int i = 0; i < n; i++) {
            int h = n - i;

            if (citations[i] >= h) {
                return h;
            }
        }

        return 0;
    }
}
```

---

# Approach 3: Counting Sort / Frequency Array (Optimal)

Since the maximum possible H-Index cannot exceed the total number of papers $n$, any citation value greater than $n$ is redundant and can be capped at $n$. This allows us to use a **frequency array** (or bucket sort) instead of sorting the elements:

1. Create a frequency array `buckets` of size $n + 1$.
2. Iterate through `citations`. If a citation `c` is greater than or equal to $n$, increment `buckets[n]`. Otherwise, increment `buckets[c]`.
3. Traverse the `buckets` array backwards from index $n$ down to $0$, accumulating the number of papers we have seen so far in a variable `count`.
4. The first index `i` where `count >= i` is our H-Index.

# Detailed Dry Run

Let's dry run the optimal approach with:
- `citations` = `[3, 0, 6, 1, 5]`, $n = 5$
- Initialize `buckets` of size $6$: `[0, 0, 0, 0, 0, 0]`

### 1. Populate the Buckets
- `citations[0] = 3` $\to$ `buckets[3]++` $\to$ `buckets = [0, 0, 0, 1, 0, 0]`
- `citations[1] = 0` $\to$ `buckets[0]++` $\to$ `buckets = [1, 0, 0, 1, 0, 0]`
- `citations[2] = 6` (which is $\ge 5$) $\to$ `buckets[5]++` $\to$ `buckets = [1, 0, 0, 1, 0, 1]`
- `citations[3] = 1` $\to$ `buckets[1]++` $\to$ `buckets = [1, 1, 0, 1, 0, 1]`
- `citations[4] = 5` (which is $\ge 5$) $\to$ `buckets[5]++` $\to$ `buckets = [1, 1, 0, 1, 0, 2]`

### 2. Backward Scan and Accumulate

| Bucket Index $i$ | Bucket Value `buckets[i]` | Accumulated `count` | Is `count >= i`? | Return Value | Notes |
| :---: | :---: | :---: | :---: | :---: | :--- |
| **5** | 2 | 2 | $2 \ge 5$ (False) | - | Keep accumulating. |
| **4** | 0 | $2 + 0 = 2$ | $2 \ge 4$ (False) | - | Keep accumulating. |
| **3** | 1 | $2 + 1 = 3$ | $3 \ge 3$ (True) | **3** | Returns `3` immediately. |

**Final Answer:** `3`

# Complexity

* Time complexity:

$$O(n)$$

Where:
* `n` = number of papers. We iterate through the `citations` array once to populate the buckets, and then iterate through the `buckets` array of size $n+1$ from right to left.

* Space complexity:

$$O(n)$$

Where:
* We allocate an extra array `buckets` of size $n+1$.

# Code

```java
class Solution {
    public int hIndex(int[] citations) {
        int n = citations.length;
        int[] buckets = new int[n + 1];

        // Step 1: Populate the frequency buckets
        for (int c : citations) {
            if (c >= n) {
                buckets[n]++;
            } else {
                buckets[c]++;
            }
        }

        // Step 2: Accumulate counts from right to left
        int count = 0;
        for (int i = n; i >= 0; i--) {
            count += buckets[i];
            if (count >= i) {
                return i;
            }
        }

        return 0;
    }
}
```

---

# Key Takeaway

The maximum possible H-Index is bounded by the total number of papers $n$. By utilizing a **frequency/bucket array** instead of sorting, we trade $O(n)$ space to improve the time complexity from $O(n \log n)$ to **$O(n)$**. This is a powerful array optimization pattern for problems where values are bounded by the input size.
