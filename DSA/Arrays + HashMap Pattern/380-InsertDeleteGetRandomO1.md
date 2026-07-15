# Intuition

The goal is to design a data structure that supports `insert`, `remove`, and `getRandom` operations in average $O(1)$ time complexity.

1. A standard hash set (`HashSet`) provides average $O(1)$ time complexity for insertions and deletions. However, since its elements are not stored sequentially or indexed, retrieving a random element requires converting the set to a list/stream or traversing it, which costs $O(n)$ time.
2. To achieve $O(1)$ time complexity for `getRandom()`, we must use a sequential, indexable data structure like a dynamic array (`ArrayList`). This allows us to generate a random index in $O(1)$ time and return the element at that index.
3. However, deleting an arbitrary element from an `ArrayList` typically requires $O(n)$ time due to shifting elements to fill the gap.
4. **The Swap-with-Last Trick**: We can circumvent this $O(n)$ shifting penalty by swapping the element we want to delete with the **last element** of the array list. Removing the last element of a dynamic array is an $O(1)$ operation because no elements need to be shifted. We can use a `HashMap` to store each element's value as the key and its corresponding list index as the value to look up indices in $O(1)$ time.

---

# Approach 1: HashSet (Sub-Optimal)

1. Store elements in a standard `HashSet`.
2. **Insert**: Directly call `set.add(val)`.
3. **Remove**: Directly call `set.remove(val)`.
4. **GetRandom**: Generate a random integer `r` between `0` and `set.size() - 1`. Convert the set to a stream, skip `r` elements, and return the first element.

# Complexity

* Time complexity:
  - `insert(val)`: $O(1)$ average time.
  - `remove(val)`: $O(1)$ average time.
  - `getRandom()`: $O(n)$ average time because skipping elements in a stream requires iterating up to `r` elements.

* Space complexity:

$$O(n)$$

Where:
* `n` = number of unique elements stored in the set.

# Code

```java
import java.util.HashSet;
import java.util.Random;
import java.util.Set;

class RandomizedSet {

    Set<Integer> set;

    public RandomizedSet() {
        set = new HashSet<>();
    }
    
    public boolean insert(int val) {
        return set.add(val);
    }
    
    public boolean remove(int val) {
        return set.remove(val);
    }
    
    public int getRandom() {
        // Converting set elements to a stream and skipping requires O(n) average time
        return set.stream().skip(new Random().nextInt(set.size())).findFirst().orElseThrow();
    }
}
```

---

# Approach 2: ArrayList + HashMap (Optimal)

We combine two data structures:
1. `ArrayList<Integer> nums`: Stores elements sequentially to provide $O(1)$ random index access.
2. `HashMap<Integer, Integer> map`: Maps each value to its index in `nums`. This allows $O(1)$ time lookup of an element's index during deletion.

### Operations:
- **Insert**:
  1. Check if the value exists in `map`. If yes, return `false`.
  2. Map the value to the current size of `nums` (which is its destination index).
  3. Add the value to `nums`.
  4. Return `true`.

- **Remove**:
  1. Check if the value exists in `map`. If no, return `false`.
  2. Retrieve the index of the element to delete (`idx`) and the last element of `nums` (`last`).
  3. Copy the `last` element to the position `idx` in `nums`.
  4. Update `map` to point `last` to its new index `idx`.
  5. Remove the last element from `nums` using `nums.remove(nums.size() - 1)` (takes $O(1)$ time).
  6. Remove `val` from `map`.
  7. Return `true`.

- **GetRandom**:
  1. Generate a random index using `rand.nextInt(nums.size())`.
  2. Return the element at that index in `nums`.

---

# Detailed Dry Run

Let's dry run a sequence of operations:
1. `insert(1)`
2. `insert(2)`
3. `insert(3)`
4. `remove(2)`
5. `getRandom()`
6. `remove(1)`

| Step | Operation | Result | State of `nums` (List) | State of `map` (Element -> Index) | Explanation / Notes |
| :---: | :---: | :---: | :---: | :---: | :--- |
| **Init** | `RandomizedSet()` | - | `[]` | `{}` | Initialize empty list and map. |
| **1** | `insert(1)` | `true` | `[1]` | `{1: 0}` | `1` is not in map. Appended to list at index 0. |
| **2** | `insert(2)` | `true` | `[1, 2]` | `{1: 0, 2: 1}` | `2` is not in map. Appended to list at index 1. |
| **3** | `insert(3)` | `true` | `[1, 2, 3]` | `{1: 0, 2: 1, 3: 2}` | `3` is not in map. Appended to list at index 2. |
| **4** | `remove(2)` | `true` | `[1, 3]` | `{1: 0, 3: 1}` | Target index = 1. Last element is `3`. Overwrite `nums[1]` with `3`. Update map mapping of `3` to index 1. Remove last element from list and `2` from map. |
| **5** | `getRandom()` | `1` or `3` | `[1, 3]` | `{1: 0, 3: 1}` | Generates random index 0 or 1. Returns `nums.get(0) = 1` or `nums.get(1) = 3`. |
| **6** | `remove(1)` | `true` | `[3]` | `{3: 0}` | Target index = 0. Last element is `3`. Overwrite `nums[0]` with `3`. Update map mapping of `3` to index 0. Remove last element from list and `1` from map. |

---

# Complexity

* Time complexity:
  - `insert(val)`: $O(1)$ average time.
  - `remove(val)`: $O(1)$ average time.
  - `getRandom()`: $O(1)$ time.

* Space complexity:

$$O(n)$$

Where:
* `n` = number of unique elements stored in the data structure.

# Code

```java
import java.util.ArrayList;
import java.util.HashMap;
import java.util.Random;

class RandomizedSet {

    private ArrayList<Integer> nums;
    private HashMap<Integer, Integer> map;
    private Random rand;

    public RandomizedSet() {
        nums = new ArrayList<>();
        map = new HashMap<>();
        rand = new Random();
    }

    public boolean insert(int val) {
        if (map.containsKey(val)) {
            return false;
        }

        // Map the value to its index in the array list
        map.put(val, nums.size());
        nums.add(val);
        return true;
    }

    public boolean remove(int val) {
        if (!map.containsKey(val)) {
            return false;
        }

        int idx = map.get(val);
        int last = nums.get(nums.size() - 1);

        // Step 1: Copy the last element over to the index of the element to delete
        nums.set(idx, last);
        map.put(last, idx);

        // Step 2: Remove the last element of the list (no shifting required)
        nums.remove(nums.size() - 1);
        
        // Step 3: Remove the deleted element from the map
        map.remove(val);

        return true;
    }

    public int getRandom() {
        // Fetch an element by generating a random index in constant time
        return nums.get(rand.nextInt(nums.size()));
    }
}
```

---

# Key Takeaway

A standard `HashMap` allows $O(1)$ search, insertions, and deletions but lacks random indexed access. By pairing it with a dynamic array (`ArrayList`), we gain $O(1)$ random retrieval. To avoid the $O(n)$ cost of shifting elements during array deletions, we use the **swap-with-last element** trick. This allows all three operations to achieve a perfect average **$O(1)$ time complexity**.
