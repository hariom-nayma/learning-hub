# Intuition

Evaluate Reverse Polish Notation (RPN) is a classic problem that requires evaluating postfix expressions. In postfix notation, operators follow their operands (e.g., instead of `3 + 4`, it is written as `3 4 +`).

A key characteristic of RPN is that we do not need parentheses to define operator precedence. Whenever we encounter an operator, it is applied to the most recently evaluated operands. This last-in, first-out (LIFO) behavior naturally maps to a **Stack** data structure:
- If the token is a number (operand), we push it onto the stack.
- If the token is an operator, we pop the top two numbers from the stack, perform the operation, and push the result back onto the stack.
- Be careful with non-commutative operations like subtraction (`-`) and division (`/`): the first popped element is the right operand (divisor/subtrahend), and the second popped element is the left operand (dividend/minuend).

---

# Approach 1: Stack Data Structure (Standard)

1. Initialize a stack to store integer operands.
2. Iterate through each token in the `tokens` array:
   - Use a `switch` statement (or `if-else` blocks) to check if the token is an operator (`+`, `-`, `*`, `/`).
   - If it is an operator:
     - Pop the top element `a` (right operand).
     - Pop the next element `b` (left operand).
     - Apply the operator (`b + a`, `b - a`, `b * a`, or `b / a`) and push the result back onto the stack.
   - If the token is a number (default case):
     - Parse the string to an integer and push it onto the stack.
3. At the end of the iteration, the stack will contain exactly one element, which is the final evaluated result. Pop and return it.

# Complexity

* Time complexity:

$$O(n)$$

Where:
* `n` = number of tokens. We iterate through the list of tokens exactly once, and each push/pop operation on the stack takes $O(1)$ time.

* Space complexity:

$$O(n)$$

Where:
* In the worst case (e.g., all operands followed by all operators), we store up to $n$ elements in the stack.

# Code

```java
import java.util.Stack;

class Solution {
    public int evalRPN(String[] tokens) {
        Stack<Integer> st = new Stack<>();

        for (String token : tokens) {
            switch (token) {
                case "+":
                    st.push(st.pop() + st.pop());
                    break;

                case "-": {
                    int a = st.pop();
                    int b = st.pop();
                    st.push(b - a);
                    break;
                }

                case "*":
                    st.push(st.pop() * st.pop());
                    break;

                case "/": {
                    int a = st.pop();
                    int b = st.pop();
                    st.push(b / a);
                    break;
                }

                default:
                    st.push(Integer.parseInt(token));
            }
        }

        return st.pop();
    }
}
```

---

# Approach 2: Array-Based Stack (Highly Optimal)

While standard stacks are easy to use, `java.util.Stack` in Java has considerable overhead because:
1. It extends `Vector`, making all its methods synchronized (which adds locking overhead).
2. It stores objects (`Integer`), causing frequent auto-boxing and unboxing between `int` and `Integer`.

We can optimize this significantly by using a primitive array `int[] stack` and a pointer `top` to simulate the stack:
- Since the maximum stack depth is bounded by `tokens.length`, we can allocate `new int[tokens.length]`.
- For operands, we store the parsed value at `stack[top++]`.
- For operators, we access the top two elements directly:
  - Left operand is at `stack[top - 2]`.
  - Right operand is at `stack[top - 1]`.
  - We store the result directly back at `stack[top - 2]` and decrement the stack pointer: `top--`.

---

# Detailed Dry Run

Let's dry run the optimal array-based approach with:
- `tokens` = `["4", "13", "5", "/", "+"]`
- Stack array allocated: `stack = [0, 0, 0, 0, 0]`, pointer `top = 0`

| Index $i$ | Token | Action | Stack State `stack` | Stack Pointer `top` | Explanation / Notes |
| :---: | :---: | :--- | :---: | :---: | :--- |
| **Start** | - | Initialize | `[0, 0, 0, 0, 0]` | 0 | Empty stack pointer at index 0. |
| **0** | `"4"` | Push Operand | `[4, 0, 0, 0, 0]` | 1 | `stack[0] = 4`. Increment `top` to 1. |
| **1** | `"13"`| Push Operand | `[4, 13, 0, 0, 0]` | 2 | `stack[1] = 13`. Increment `top` to 2. |
| **2** | `"5"` | Push Operand | `[4, 13, 5, 0, 0]` | 3 | `stack[2] = 5`. Increment `top` to 3. |
| **3** | `"/"` | Evaluate `/` | `[4, 2, 5, 0, 0]` | 2 | `stack[top-2] = stack[1] / stack[2]` $\to$ `13 / 5 = 2`. Overwrite `stack[1]` with `2`. Decrement `top` to 2. |
| **4** | `"+"` | Evaluate `+` | `[6, 2, 5, 0, 0]` | 1 | `stack[top-2] = stack[0] + stack[1]` $\to$ `4 + 2 = 6`. Overwrite `stack[0]` with `6`. Decrement `top` to 1. |

**Final Return:** `stack[0] = 6`

---

# Complexity

* Time complexity:

$$O(n)$$

Where:
* `n` = number of tokens. We iterate through the array once. Each operation takes true $O(1)$ time with no method call, synchronization, or object boxing overhead.

* Space complexity:

$$O(n)$$

Where:
* We allocate a primitive array of size `n`.

# Code

```java
class Solution {
    public int evalRPN(String[] tokens) {
        int[] stack = new int[tokens.length];
        int top = 0;

        for (String token : tokens) {
            switch (token) {
                case "+":
                    // Pop two, add, and push result back
                    stack[top - 2] = stack[top - 2] + stack[top - 1];
                    top--;
                    break;

                case "-":
                    // Pop two, subtract, and push result back
                    stack[top - 2] = stack[top - 2] - stack[top - 1];
                    top--;
                    break;

                case "*":
                    // Pop two, multiply, and push result back
                    stack[top - 2] = stack[top - 2] * stack[top - 1];
                    top--;
                    break;

                case "/":
                    // Pop two, divide, and push result back
                    stack[top - 2] = stack[top - 2] / stack[top - 1];
                    top--;
                    break;

                default:
                    // Parse integer and push it to the stack
                    stack[top++] = Integer.parseInt(token);
            }
        }

        // The final remaining element is the result
        return stack[0];
    }
}
```

# Key Takeaway

Using `java.util.Stack` is robust and matches the conceptual flow of the algorithm. However, in scenarios demanding ultra-high performance or runtime efficiency, using a raw primitive array to simulate a stack is a superior alternative. By managing a simple index pointer `top` and writing directly to the array, we bypass **synchronization locking** and **auto-boxing/unboxing**, transforming a heap-allocated object stack into a fast cache-friendly array.
