# Intuition

To find the top $k$ most frequent elements, we first need to count the frequency of each element. A HashMap is ideal for this, mapping each element to its count.

Once the frequencies are counted, we need to extract the $k$ elements with the highest frequencies:

1. **Min-Heap (Priority Queue)**: We can maintain a heap of size $k$. As we iterate through the unique numbers, we push them into the heap. If the size of the heap exceeds $k$, we remove the least frequent element. This leaves us with the $k$ most frequent elements.
2. **Bucket Sort (Optimal)**: We can group elements into buckets where the index of the bucket represents the frequency. Since the maximum frequency cannot exceed the array length $n$, we can use an array of lists of size $n + 1$. Iterating backward from the highest possible frequency bucket to the lowest allows us to collect the top $k$ frequent elements in linear time.

# Approach 1: Priority Queue (Min-Heap)

1. Build a frequency map of the elements in the input array.
2. Maintain a Min-Heap (PriorityQueue) of size $k$, ordered by the elements' frequencies in ascending order.
3. Iterate through the unique elements from the frequency map and add them to the heap.
4. If the heap's size exceeds $k$, remove the top element (the one with the lowest frequency).
5. Extract the elements from the heap into the result array.

# Complexity

* Time complexity:

$$O(n \log k)$$

Where:

* `n` = number of elements in the array

* `k` = number of top frequent elements to return

* Space complexity:

$$O(n + k)$$

To store the frequency map of size $O(n)$ and the heap of size $O(k)$.

# Code

```java
class Solution {
    public int[] topKFrequent(int[] nums, int k) {
        int[] ans = new int[k];

        Map<Integer,Integer> mp = new HashMap();

        PriorityQueue<Integer> pq = new PriorityQueue((a,b) -> mp.get(a) - mp.get(b));

        for(int i=0;i<nums.length;i++){
            mp.put(nums[i], mp.getOrDefault(nums[i],0)+1);
        }

        for(int i:mp.keySet()){
            pq.add(i);

            if(pq.size()>k) pq.poll();
        }

        for(int i=0;i<k;i++){
            ans[i]=pq.poll();
        }
        return ans;
    }
}
```

---

# Approach 2: Bucket Sort (Optimal)

1. Count the frequency of each element using a HashMap.
2. Create an array of lists (buckets) of size `nums.length + 1`, where the index represents the frequency of elements.
3. For each element in the frequency map, place the element in the bucket corresponding to its frequency.
4. Iterate backward from the end of the bucket array (highest frequency to lowest) and collect elements until we have accumulated $k$ elements.

# Complexity

* Time complexity:

$$O(n)$$

Where:

* `n` = number of elements in the array

* Space complexity:

$$O(n)$$

To store the frequency map and the bucket array of lists.

# Code

```java
class Solution {
    public int[] topKFrequent(int[] nums, int k) {

        Map<Integer, Integer> freq = new HashMap<>();

        for (int num : nums) {
            freq.put(num, freq.getOrDefault(num, 0) + 1);
        }

        List<Integer>[] bucket = new ArrayList[nums.length + 1];

        for (int num : freq.keySet()) {

            int f = freq.get(num);

            if (bucket[f] == null) {
                bucket[f] = new ArrayList<>();
            }

            bucket[f].add(num);
        }

        int[] ans = new int[k];
        int idx = 0;

        for (int i = bucket.length - 1; i >= 0 && idx < k; i--) {

            if (bucket[i] == null) continue;

            for (int num : bucket[i]) {

                ans[idx++] = num;

                if (idx == k) break;
            }
        }

        return ans;
    }
}
```

# Key Takeaway

The heap-based approach is simple and uses less auxiliary memory for sorting ($O(k)$ extra space beyond the frequency map), but takes $O(n \log k)$ time. The bucket sort approach achieves linear time complexity $O(n)$ by leveraging the fact that frequencies are bounded by $n$, making it the optimal solution for large inputs.
