# Intuition

Anagrams contain the same characters with the same frequencies.

A straightforward approach is to compare every string with every other string and group those that are anagrams. To check whether two strings are anagrams, we can count the frequency of each character.

However, comparing every pair of strings is expensive. We can optimize this by creating a unique key for each anagram group. If we sort the characters of a string, all anagrams will generate the same sorted string, which can be used as a HashMap key.

For example:

* `"eat"` → `"aet"`
* `"tea"` → `"aet"`
* `"ate"` → `"aet"`

Since they share the same key, they belong to the same group.

# Approach 1: Brute Force

1. Iterate through all strings.
2. For each unprocessed string, create a new group.
3. Compare it with every remaining string.
4. Use a frequency array of size 26 to check whether two strings are anagrams.
5. Add matching strings to the same group.
6. Mark processed strings to avoid duplicate work.

# Complexity

* Time complexity:

$$O(n^2 \cdot k)$$

Where:

* `n` = number of strings

* `k` = average string length

* Space complexity:

$$O(1)$$

Ignoring the output list.

# Code

```java
class Solution {

    public boolean solve(String s, String t) {
        if (s.length() != t.length()) return false;

        int[] freq = new int[26];

        for (int i = 0; i < s.length(); i++) {
            freq[s.charAt(i) - 'a']++;
            freq[t.charAt(i) - 'a']--;
        }

        for (int x : freq) {
            if (x != 0) return false;
        }

        return true;
    }

    public List<List<String>> groupAnagrams(String[] strs) {

        List<List<String>> ans = new ArrayList<>();
        boolean[] done = new boolean[strs.length];

        for (int i = 0; i < strs.length; i++) {

            if (done[i]) continue;

            List<String> group = new ArrayList<>();
            group.add(strs[i]);
            done[i] = true;

            for (int j = i + 1; j < strs.length; j++) {

                if (!done[j] && solve(strs[i], strs[j])) {
                    group.add(strs[j]);
                    done[j] = true;
                }
            }

            ans.add(group);
        }

        return ans;
    }
}
```

---

# Approach 2: HashMap + Sorting (Optimal)

Instead of comparing every pair of strings:

1. Sort each string.
2. Use the sorted string as a key.
3. Store all strings with the same key in a HashMap.
4. Return all groups stored in the HashMap.

For example:

```text
eat -> aet
tea -> aet
ate -> aet
```

All three strings map to the same key `"aet"`.

# Complexity

* Time complexity:

$$O(n \cdot k \log k)$$

Where:

* `n` = number of strings

* `k` = average string length

* Space complexity:

$$O(n \cdot k)$$

# Code

```java
class Solution {
    public List<List<String>> groupAnagrams(String[] strs) {

        Map<String, List<String>> mp = new HashMap<>();

        for (String s : strs) {

            char[] c = s.toCharArray();
            Arrays.sort(c);

            String key = new String(c);

            mp.computeIfAbsent(key,
                    k -> new ArrayList<>())
              .add(s);
        }

        return new ArrayList<>(mp.values());
    }
}
```

# Key Takeaway

The brute-force solution helps build intuition by directly comparing strings using character frequencies. The HashMap solution avoids unnecessary comparisons by generating a canonical representation (sorted string) for every anagram group, reducing the complexity from **O(n² · k)** to **O(n · k log k)**.
