# Intuition

The problem asks us to find the minimum number of jumps to reach the last index of an array `nums`, starting from the first index (index `0`). Each element `nums[i]` represents the maximum jump length from that position.

We can solve this problem using two main approaches:
1. **Top-Down Dynamic Programming (Memoization)**: Recursively exploring all possible jumps from each index and using a `dp` array to store results and avoid redundant computations.
2. **Greedy Approach (Optimal)**: Visualizing the process as a level-by-level Breadth-First Search (BFS) where each level represents the range of indices reachable with a certain number of jumps. By keeping track of the boundaries of these levels, we can compute the minimum jumps in a single pass.

---

# Approach 1: Dynamic Programming (Memoization)

1. Define a recursive helper function `solver(nums, k)` that returns the minimum jumps required to reach the last index starting from index `k`.
2. **Base Cases**:
   - If `k >= nums.length`, we have jumped past the bounds of the array. Return `Integer.MAX_VALUE` to signify an invalid path.
   - If `k == nums.length - 1`, we are already at the last index. Return `0` jumps.
3. **Memoization**: If `dp[k]` is already computed (i.e., not `-1`), return `dp[k]`.
4. **Transition**:
   - Loop through all possible jump steps `i` from `1` up to `nums[k]`.
   - Recursively compute the solution for the target index `k + i`.
   - If the returned value is valid (not `Integer.MAX_VALUE`), update our minimum jumps: `mini = Math.min(mini, sol + 1)`.
5. Store the calculated minimum in `dp[k]` and return it.

# Complexity

* Time complexity:

$$O(n \cdot m)$$

Where:
* `n` = length of the `nums` array. There are `n` unique subproblems to solve (indices from `0` to `n-1`).
* `m` = maximum jump size (the value of `nums[k]`). For each subproblem, we loop up to `nums[k]` times. In the worst case where $m \approx n$, the time complexity becomes $O(n^2)$.

* Space complexity:

$$O(n)$$

Where:
* We use a `dp` array of size `n` for memoization.
* The recursion call stack can grow up to depth `n` in the worst case.

# Code

```java
class Solution {

    int[] dp;

    public int solver(int[] nums, int k) {
        // Base case: if we overshoot the array boundary, return infinity
        if (k >= nums.length) return Integer.MAX_VALUE;
        // Base case: if we reach the last element, no more jumps are needed
        if (k == nums.length - 1) return 0;

        // Return memoized result if already computed
        if (dp[k] != -1) return dp[k];

        int mini = Integer.MAX_VALUE;

        // Try all possible jump lengths from index k
        for (int i = 1; i <= nums[k]; i++) {
            int sol = solver(nums, k + i);

            // If a valid path to the end exists, update mini
            if (sol != Integer.MAX_VALUE) {
                mini = Math.min(mini, sol + 1);
            }
        }

        // Memoize and return the result
        return dp[k] = mini;
    }

    public int jump(int[] nums) {
        dp = new int[nums.length];
        java.util.Arrays.fill(dp, -1);

        return solver(nums, 0);
    }
}
```

---

# Approach 2: Greedy (Optimal)

Instead of evaluating all possible paths recursively, we can think of the problem in terms of **intervals/ranges**:
- We start with a range of $[0, 0]$ (jumps = 0).
- From index 0, we can jump to any index in the range $[1, \text{nums}[0]]$. This forms our next level of reachability.
- At each index, we greedily update the furthest index we can reach (`farthest`).
- When our loop counter `i` reaches the end of the current jump boundary (`currEnd`), we know we must take another jump to proceed further. So we increment `jumps` and update `currEnd` to `farthest`.
- Since we want to reach the last element, we only loop up to `nums.length - 2`. As soon as we enter or can reach the last element, our greedy updates will capture it without needing to transition *from* the last index.

---

# Detailed Dry Run

Let's dry run the optimal greedy code with:
- `nums` = `[2, 3, 1, 1, 4]`

Initial state: `jumps = 0`, `currEnd = 0`, `farthest = 0`

| Index $i$ | Element `nums[i]` | Farthest Reachable (`farthest = max(farthest, i + nums[i])`) | Current Jump End (`currEnd`) | Is $i == \text{currEnd}$? | `jumps` | Notes |
| :---: | :---: | :---: | :---: | :---: | :---: | :--- |
| **Start** | - | 0 | 0 | - | 0 | Initialize values. |
| **0** | 2 | $\max(0, 0 + 2) = 2$ | 0 | Yes | **1** | Reached `currEnd` (0). Increment `jumps` to 1. Set `currEnd = farthest = 2`. |
| **1** | 3 | $\max(2, 1 + 3) = 4$ | 2 | No | 1 | Update `farthest` to 4. We are within range of the 1st jump. |
| **2** | 1 | $\max(4, 2 + 1) = 4$ | 2 | Yes | **2** | Reached `currEnd` (2). Increment `jumps` to 2. Set `currEnd = farthest = 4`. |
| **3** | 1 | $\max(4, 3 + 1) = 4$ | 4 | No | 2 | Loop terminates because we only iterate up to `nums.length - 2` (index 3). |

**Final Answer:** `2`

---

# Complexity

* Time complexity:

$$O(n)$$

Where:
* `n` = length of the `nums` array. We iterate through the array from index `0` to `n-2` exactly once.

* Space complexity:

$$O(1)$$

Where:
* We only use three integer variables (`jumps`, `currEnd`, `farthest`) to keep track of boundaries and counts.

# Code

```java
class Solution {
    public int jump(int[] nums) {
        int jumps = 0;
        int currEnd = 0;
        int farthest = 0;

        // Iterate up to nums.length - 2
        for (int i = 0; i < nums.length - 1; i++) {
            // Keep track of the farthest point reachable from current range
            farthest = Math.max(farthest, i + nums[i]);

            // If we have reached the boundary of the current jump
            if (i == currEnd) {
                jumps++;
                currEnd = farthest;
            }
        }

        return jumps;
    }
}
```

# Key Takeaway

The problem shifts from checking all combinations (which DP does in $O(n^2)$ time) to mapping out range boundaries using a greedy approach (BFS-like interval updates). By maintaining `farthest` (the potential maximum reach) and jumping only when we reach the boundary of our current reach (`currEnd`), we find the minimum jumps in a single pass with **$O(n)$ time** and **$O(1)$ space**.
