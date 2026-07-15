# Intuition

To find the longest consecutive sequence in $O(n)$ time, we need a way to check if an element exists in our collection in $O(1)$ time. A HashSet is ideal for this since it provides $O(1)$ average-time complexity for search operations.

A naive approach would sort the array, which takes $O(n \log n)$ time. To do this in $O(n)$ time, we can store all numbers in a HashSet and identify the start of each consecutive sequence:
* A number `x` is the start of a consecutive sequence if `x - 1` is not in the Set.
* Once a start of a sequence is found, we can count the length of the sequence by checking for the existence of `x + 1`, `x + 2`, etc., in the Set.

# Approach 1: HashSet + Array Iteration

1. Insert all elements of the array into a HashSet to allow $O(1)$ lookups and filter duplicates.
2. Iterate through the elements of the original array `nums`.
3. For each element, check if it can be the starting point of a sequence by verifying if `nums[i] - 1` is *not* present in the Set.
4. If it is a starting point, increment the value (`nums[i] + 1`, `nums[i] + 2`, ...) and check their presence in the Set, keeping track of the current sequence length.
5. Update the maximum length found so far.

# Complexity

* Time complexity:

$$O(n)$$

Where:

* `n` = number of elements in the array

Each element is processed at most twice: once in the outer loop, and potentially once in the inner `while` loop (when it is part of a consecutive sequence). Therefore, the overall time complexity is linear.

* Space complexity:

$$O(n)$$

To store the elements in the HashSet.

# Code

```java
class Solution {
    public int longestConsecutive(int[] nums) {
        Set<Integer> st = new HashSet();

        for(int i:nums){
            st.add(i);
        }

        int count = 0;

        for(int i=0;i<nums.length;i++){
            int c = 1;
            if(!st.contains(nums[i]-1)){
                int num = nums[i];
                while(st.contains(++num)) c++;
            }
            count = Math.max(count,c);
        }
        return count;
    }
}
```

---

# Approach 2: HashSet + Unique Element Iteration (Optimal)

This approach refines the iteration by looping over the unique elements in the HashSet directly rather than the original array (which might contain duplicate elements).

1. Insert all elements of the array into a HashSet.
2. Iterate through the elements in the HashSet.
3. For each element `s` in the set, check if `s - 1` is in the set. If it is, skip it (since `s` cannot be the start of the sequence).
4. If `s - 1` is not present, we have found the start of a sequence. Count its consecutive elements (`s + 1`, `s + 2`, ...) using a `while` loop.
5. Update the maximum sequence length.

# Complexity

* Time complexity:

$$O(n)$$

Where:

* `n` = number of elements in the array

Iterating through the unique elements in the HashSet instead of the array prevents redundant lookups for duplicate values. The inner `while` loop only triggers for the start of each sequence.

* Space complexity:

$$O(n)$$

To store the unique elements in the HashSet.

# Code

```java
class Solution {
    // public int consecutiveCount(int )
    public int longestConsecutive(int[] nums) {
        int ans = 0;
        Set<Integer> st = new HashSet();

        for(int i:nums){
            st.add(i);
        }

        for(Integer s:st){
            if(st.contains(s-1)) continue;

            int count = 1;
            while(st.contains(s+count)) count++;

            ans = Math.max(ans,count);
        }

        return ans;

    }
}
```

# Key Takeaway

By storing all elements in a HashSet, we can verify sequence bounds in $O(1)$ time. Identifying sequence starts (`x - 1` not in the Set) ensures we only traverse each consecutive sequence once, keeping the complexity linear $O(n)$ instead of $O(n \log n)$ from sorting. Iterating over the unique keys of the Set rather than the array avoids unnecessary lookups on duplicate elements.
