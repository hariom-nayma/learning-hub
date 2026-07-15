# Intuition

The problem asks us to determine if there exists a continuous subarray of size at least 2 whose sum is a multiple of $k$.

A naive approach would check every possible subarray sum by using nested loops, which takes $O(n^2)$ time. To solve this in $O(n)$ time, we can use a **Prefix Sum** approach combined with a **HashMap** and modular arithmetic.

---

# Approach: HashMap + Prefix Sum Modulo (Optimal)

Instead of calculating the sum of every possible subarray, we can track the remainders of prefix sums when divided by $k$.

### 1. Mathematical Concept
Let $P[i]$ be the prefix sum from index $0$ to $i$:
$$P[i] = \sum_{x=0}^{i} \text{nums}[x]$$

The sum of any subarray from index $j+1$ to $i$ ($i > j$) can be represented as:
$$\text{SubarraySum}(j+1 \text{ to } i) = P[i] - P[j]$$

We want this subarray sum to be a multiple of $k$:
$$(P[i] - P[j]) \equiv 0 \pmod k$$

Using modular arithmetic properties, this is equivalent to:
$$P[i] \equiv P[j] \pmod k$$

In other words, if we find two prefix sums that yield the same remainder when divided by $k$, the elements between those two indices sum up to a multiple of $k$.

### 2. Role of the HashMap
We maintain a HashMap `map` where:
- **Key**: A prefix sum remainder `rem = prefixSum % k`.
- **Value**: The first index where this remainder occurred.

As we iterate through the array:
1. Update the running prefix sum: `prefixSum += nums[i]`.
2. Compute the modulo remainder: `rem = prefixSum % k`.
3. Check if `rem` already exists in the map:
   - **If it exists**: Retrieve the index `j = map.get(rem)`. The length of the subarray with a sum divisible by $k$ is $i - j$. If $i - j \ge 2$, return `true`.
   - **If it does not exist**: Store the remainder with the current index: `map.put(rem, i)`.

> [!IMPORTANT]
> If a remainder is already present in the map, **do not** update its index. Keeping the earliest index (first occurrence) maximizes the length of the potential subarray found in future steps.

### 3. Base Case Initialization: `map.put(0, -1)`
We must initialize the map with `map.put(0, -1)`.
- **Why?** If a running prefix sum itself is a multiple of $k$ from index $0$ to $i$ (meaning `prefixSum % k == 0`), the subarray starts at index $0$.
- The length of this subarray is $i - (-1) = i + 1$. Putting `(0, -1)` in the map ensures that if we see a remainder of `0` at index `1` or later, the length check $i - (-1) \ge 2$ will evaluate correctly to `true`.

---

# Detailed Dry Run

Let's dry run the code with:
- `nums` = `[23, 2, 4, 6, 7]`
- `k` = `6`

Initial state: `prefixSum = 0`, `map = {0: -1}`

| Index $i$ | Element `nums[i]` | Running `prefixSum` | Remainder `rem = prefixSum % 6` | Present in Map? | Subarray Length ($i - \text{prev\_idx}$) | Action / Notes |
| :---: | :---: | :---: | :---: | :---: | :---: | :--- |
| **Start** | - | 0 | 0 | Yes (at -1) | - | Map initialized with `{0: -1}` |
| **0** | 23 | 23 | $23 \pmod 6 = 5$ | No | - | Add `{5: 0}` to map. Map: `{0: -1, 5: 0}` |
| **1** | 2 | 25 | $25 \pmod 6 = 1$ | No | - | Add `{1: 1}` to map. Map: `{0: -1, 5: 0, 1: 1}` |
| **2** | 4 | 29 | $29 \pmod 6 = 5$ | Yes (at 0) | $2 - 0 = 2$ | Length is $\ge 2$. Return `true`! |

**Final Output:** `true` (valid subarray is `[2, 4]`, which sums to `6`).

---

# Complexity

* Time complexity:

$$O(n)$$

Where:
* `n` = number of elements in the array. We loop through the array exactly once, performing constant time $O(1)$ HashMap lookups and insertions.

* Space complexity:

$$O(\min(n, k))$$

Where:
* The HashMap stores at most $k$ unique remainders (ranging from $0$ to $k-1$), or at most $n$ entries if the array size $n$ is smaller than $k$.

# Code

```java
class Solution {
    public boolean checkSubarraySum(int[] nums, int k) {
        Map<Integer, Integer> map = new HashMap<>();
        map.put(0, -1);
        int prefixSum = 0;
        for (int i = 0; i < nums.length; i++) {
            prefixSum += nums[i];
            int rem = prefixSum % k;
            if (map.containsKey(rem)) {
                if (i - map.get(rem) >= 2) {
                    return true;
                }
            } else {
                map.put(rem, i);
            }
        }
        return false;
    }
}
```

# Key Takeaway

By tracking the remainders of the running prefix sum instead of the prefix sums themselves, we reduce the problem of finding a multiple of $k$ to finding two matching remainders. Storing the first occurrence index of each remainder in a HashMap allows us to quickly verify both the divisibility requirement and the subarray length constraint ($\ge 2$) in linear time $O(n)$ and $O(\min(n, k))$ space.
