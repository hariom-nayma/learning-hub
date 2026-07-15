# Intuition

To find the length of the longest substring without repeating characters, we need to explore contiguous substrings. A naive brute force approach checks all possible substrings and verifies if they have unique characters, taking $O(n^3)$ or $O(n^2)$ time.

To optimize, we can use a **Sliding Window** technique:
- We maintain a window defined by two pointers, `left` (start of window) and `right` (end of window).
- As `right` expands the window, we add characters to our lookup structure.
- If we encounter a duplicate character, we shrink or adjust the `left` pointer to exclude the duplicate, maintaining the invariant that the window contains only unique characters.

---

# Approach 1: Sliding Window + HashSet

1. Use two pointers, `i` (left) and `j` (right), and a HashSet `st` to store unique characters.
2. Initialize the window by adding the first character to the set and setting `j = 1`.
3. Expand the window by moving `j` to the right:
   - If `s.charAt(j)` is already in the set, shrink the window from the left by removing `s.charAt(i)` from the set and incrementing `i` until the duplicate character is removed.
   - Add the current character `s.charAt(j)` to the set.
   - Update the maximum window length: `ans = Math.max(ans, j - i + 1)`.
4. Return `ans`.

# Complexity

* Time complexity:

$$O(n)$$

Where:
* `n` = length of the string `s`.
Although there is a nested loop, each character is added to the Set at most once and removed from the Set at most once. Both the left pointer `i` and right pointer `j` traverse the string at most once, leading to an overall linear time complexity.

* Space complexity:

$$O(\min(n, m))$$

Where:
* `m` = size of the character set (alphabet).
The HashSet stores at most the number of unique characters in the string, which is bounded by the size of the character set.

# Code

```java
class Solution {
    public int lengthOfLongestSubstring(String s) {
        if(s.length() == 0 || s.length() == 1) return s.length();

        int ans = 0;

        Set<Character> st = new HashSet();
        int i=0;
        int j=1;

        st.add(s.charAt(0));

        while(j<s.length()){
            while(st.contains(s.charAt(j))){
                st.remove(s.charAt(i));
                i++;
            }
            st.add(s.charAt(j));
            ans = Math.max(ans, j-i+1);   
            j++;
        }
        return ans;
    }
}
```

---

# Approach 2: Sliding Window + Last Seen Index Array (Optimal)

Instead of gradually shifting the left pointer `left` character-by-character, we can record the last seen index of each character. When a duplicate is encountered, we can directly **jump** the `left` pointer past the last seen index of that character.

### 1. Mechanism
- We use an integer array `lastSeen` of size 128 (covering all ASCII characters) to store the most recent index where each character appeared. Initialize all elements to `-1`.
- For each character `ch` at index `right`:
  - If `lastSeen[ch] >= left`, it means the character has been seen within the current window. We immediately move the `left` pointer to `lastSeen[ch] + 1` to exclude the duplicate.
  - Update `lastSeen[ch] = right`.
  - Calculate and update the maximum length `max = Math.max(max, right - left + 1)`.

> [!TIP]
> Jumping the `left` pointer directly to `lastSeen[ch] + 1` avoids the inner loop entirely, leading to a single-pass traversal.

---

# Detailed Dry Run

Let's dry run the optimal code with:
- `s` = `"abcabcbb"`

Initial state: `max = 0`, `left = 0`, `lastSeen` array filled with `-1`s.

| Index `right` | Character `ch` | Stored `lastSeen[ch]` | Condition: `lastSeen[ch] >= left` | Updated `left` | Updated `lastSeen[ch]` | Current Window | Window Length (`right - left + 1`) | Updated `max` |
| :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **0** | `'a'` | `-1` | No ($-1 \ge 0$ is false) | `0` | `lastSeen['a'] = 0` | `"a"` | $0 - 0 + 1 = 1$ | **1** |
| **1** | `'b'` | `-1` | No ($-1 \ge 0$ is false) | `0` | `lastSeen['b'] = 1` | `"ab"` | $1 - 0 + 1 = 2$ | **2** |
| **2** | `'c'` | `-1` | No ($-1 \ge 0$ is false) | `0` | `lastSeen['c'] = 2` | `"abc"` | $2 - 0 + 1 = 3$ | **3** |
| **3** | `'a'` | `0` | Yes ($0 \ge 0$ is true) | `0 + 1 = 1` | `lastSeen['a'] = 3` | `"bca"` | $3 - 1 + 1 = 3$ | **3** |
| **4** | `'b'` | `1` | Yes ($1 \ge 1$ is true) | `1 + 1 = 2` | `lastSeen['b'] = 4` | `"cab"` | $4 - 2 + 1 = 3$ | **3** |
| **5** | `'c'` | `2` | Yes ($2 \ge 2$ is true) | `2 + 1 = 3` | `lastSeen['c'] = 5` | `"abc"` | $5 - 3 + 1 = 3$ | **3** |
| **6** | `'b'` | `4` | Yes ($4 \ge 3$ is true) | `4 + 1 = 5` | `lastSeen['b'] = 6` | `"cb"` | $6 - 5 + 1 = 2$ | **3** |
| **7** | `'b'` | `6` | Yes ($6 \ge 5$ is true) | `6 + 1 = 7` | `lastSeen['b'] = 7` | `"b"` | $7 - 7 + 1 = 1$ | **3** |

**Final Output:** `3`

---

# Complexity

* Time complexity:

$$O(n)$$

Where:
* `n` = length of the string `s`.
We iterate through the string exactly once. Each lookup and update in the fixed-size `lastSeen` array takes $O(1)$ time.

* Space complexity:

$$O(m)$$

Where:
* `m` = size of the character set (128 for standard ASCII).
The space complexity is constant $O(1)$ if the character set size is fixed.

# Code

```java
class Solution {
    public int lengthOfLongestSubstring(String s) {
        int max = 0;
        int left = 0;

        int[] lastSeen = new int[128];

        for (int i = 0; i < 128; i++) {
            lastSeen[i] = -1;
        }

        for (int right = 0; right < s.length(); right++) {
            char ch = s.charAt(right);

            if (lastSeen[ch] >= left) {
                left = lastSeen[ch] + 1;
            }

            lastSeen[ch] = right;
            max = Math.max(max, right - left + 1);
        }

        return max;
    }
}
```

# Key Takeaway

While the basic sliding window shifts the left pointer step-by-step using a nested loop, tracking the indices of characters allows the left pointer to jump directly to the optimal starting position. Using a fixed-size direct-access index array (like a size-128 array for ASCII) is highly performant, eliminating the overhead of hash map lookups.
