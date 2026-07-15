# Intuition

The problem asks us to find the total number of continuous subarrays whose sum equals a target value `k`.

A naive approach is to check every possible subarray, calculate its sum, and check if it equals `k`. This is simple but slow.

To optimize, we can use the concept of **Prefix Sums** combined with a **HashMap**. A prefix sum is the cumulative sum of the array from the beginning up to a certain index. By storing these prefix sums in a HashMap, we can determine in $O(1)$ time if there exists a previous prefix sum that, when subtracted from our current prefix sum, yields `k`.

---

# Approach 1: Brute Force (Cumulative Sum / Nested Loops)

1. Use nested loops to generate all possible subarrays.
2. The outer loop defines the starting index `i` of the subarray.
3. The inner loop defines the ending index `j` of the subarray.
4. Keep a running sum `sum` for each start index. If `sum == k` at any point, increment our count.

# Complexity

* Time complexity:

$$O(n^2)$$

Where:
* `n` = number of elements in the `nums` array. We use nested loops of size `n` to check every subarray.

* Space complexity:

$$O(1)$$

Since we only use a few variables for counting and storing the temporary sum.

# Code

```java
class Solution {
    public int subarraySum(int[] nums, int k) {
        int count = 0;
        for (int i = 0; i < nums.length; i++) {
            int sum = 0;
            for (int j = i; j < nums.length; j++) {
                sum += nums[j];
                if (sum == k) {
                    count++; 
                }
            }
        }
        return count;
     }
}
```

---

# Approach 2: Prefix Sum + HashMap (Optimal)

Instead of recalculating subarray sums repeatedly:

### 1. Mathematical Concept
Let $P[j]$ be the prefix sum from index $0$ to $j$:
$$P[j] = \sum_{x=0}^{j} \text{nums}[x]$$

The sum of any subarray from index $i$ to $j$ ($i \le j$) can be expressed as:
$$\text{SubarraySum}(i \text{ to } j) = P[j] - P[i-1]$$

We want to find subarrays where:
$$P[j] - P[i-1] = k$$

Rearranging this equation gives:
$$P[i-1] = P[j] - k$$

Thus, at any index $j$ with current prefix sum $P[j]$ (which is `sum` in the code), if we have seen a previous prefix sum equal to $P[j] - k$ (which is `sum - k` in the code), then the subarray between $i$ and $j$ sums up to $k$.

### 2. Role of the HashMap
We keep a HashMap `mp` where:
- **Key**: A prefix sum we have encountered.
- **Value**: The number of times this prefix sum has occurred so far.

As we iterate through the array:
1. Update our running prefix sum: `sum += nums[i]`.
2. Check if `sum - k` exists in the HashMap. If it does, it means there are one or more valid starting points for subarrays ending at $i$ that sum up to $k$. We add the frequency of `sum - k` from the map to our answer: `ans += mp.getOrDefault(sum - k, 0)`.
3. Add the current prefix sum to the map or increment its count: `mp.put(sum, mp.getOrDefault(sum, 0) + 1)`.

### 3. Base Case Initialization: `mp.put(0, 1)`
We must initialize the map with `mp.put(0, 1)`. 
- **Why?** If the running prefix sum `sum` itself becomes exactly equal to `k` (i.e. `sum == k`), then `sum - k` will be `0`. 
- Without `mp.put(0, 1)`, we would not count the subarray that starts from index $0$ and goes up to the current index. Putting `(0, 1)` ensures that any prefix sum that equals `k` directly matches a prefix sum of `0` that occurred "before the array started".

---

# Detailed Dry Run

Let's dry run the optimal code with:
- `nums` = `[3, 4, 7, 2, -3, 1, 4, 2]`
- `k` = `7`

Initial state: `sum = 0`, `ans = 0`, `mp = {0: 1}`

| Index $i$ | Element `nums[i]` | Current `sum` | Target `sum - k` | Count of `sum - k` in Map | New `ans` | Updated Map `mp` | Notes |
| :---: | :---: | :---: | :---: | :---: | :---: | :--- | :--- |
| **Start** | - | 0 | - | - | 0 | `{0: 1}` | Initialize with `{0: 1}` |
| **0** | 3 | 3 | $3 - 7 = -4$ | 0 | 0 | `{0: 1, 3: 1}` | No subarray found. |
| **1** | 4 | 7 | $7 - 7 = 0$ | 1 | **1** | `{0: 1, 3: 1, 7: 1}` | Found subarray `[3, 4]` (sum 7). |
| **2** | 7 | 14 | $14 - 7 = 7$ | 1 | **2** | `{0: 1, 3: 1, 7: 1, 14: 1}` | Found subarray `[4, 7]` (sum 7). |
| **3** | 2 | 16 | $16 - 7 = 9$ | 0 | 2 | `{0: 1, 3: 1, 7: 1, 14: 1, 16: 1}` | No subarray found. |
| **4** | -3 | 13 | $13 - 7 = 6$ | 0 | 2 | `{0: 1, 3: 1, 7: 1, 14: 1, 16: 1, 13: 1}` | No subarray found. |
| **5** | 1 | 14 | $14 - 7 = 7$ | 1 | **3** | `{0: 1, 3: 1, 7: 1, 14: 2, 16: 1, 13: 1}` | Found subarray `[7, 2, -3, 1]` (sum 7). |
| **6** | 4 | 18 | $18 - 7 = 11$ | 0 | 3 | `{..., 18: 1}` | No subarray found. |
| **7** | 2 | 20 | $20 - 7 = 13$ | 1 | **4** | `{..., 20: 1}` | Found subarray `[2, -3, 1, 4, 2]` (sum 7). |

**Final Answer:** `4`

---

# Complexity

* Time complexity:

$$O(n)$$

Where:
* `n` = length of the `nums` array. We iterate through the array exactly once, and each HashMap lookup/insertion takes $O(1)$ on average.

* Space complexity:

$$O(n)$$

In the worst case, all prefix sums are unique, and we store $n$ entries in the HashMap.

# Code

```java
import java.util.HashMap;
import java.util.Map;

class Solution {
    public int subarraySum(int[] nums, int k) {
        // Base edge case: If array size is 1, check if the single element is equal to k
        if (nums.length == 1 && k != nums[0]) {
            return 0;
        }

        Map<Integer, Integer> mp = new HashMap<>();

        // Base case: prefix sum of 0 occurs 1 time initially
        mp.put(0, 1);
        
        int sum = 0;
        int ans = 0;

        for (int i = 0; i < nums.length; i++) {
            sum += nums[i];

            // If (sum - k) is present in map, add its frequency to the answer
            ans += mp.getOrDefault(sum - k, 0);

            // Record/update current prefix sum frequency
            mp.put(sum, mp.getOrDefault(sum, 0) + 1);
        }
        
        return ans;
     }
}
```

# Key Takeaway

The optimal solution shifts the problem from "summing all possible windows" to "checking if a matching target prefix sum occurred in the past". By utilizing the prefix sum relationship $P[i-1] = P[j] - k$ and caching historical sums in a $O(1)$ HashMap, we optimize the time complexity from **$O(n^2)$** down to **$O(n)$**. Initializing the map with `(0, 1)` is a critical step to count valid subarrays that start from index $0$.
