(define r 10)

(* pi (* r r))

(if (> (* 11 11) 120) (* 7 6) oops)

(list (+ 1 1) (+ 2 2) (* 2 3) (expt 2 3))

(define circle-area (lambda (r) (* pi (* r r)))

(circle-area (+ 5 5))

-------------------------------------------

(define fact (lambda (n) (if (<= n 1) 1 (* n (fact (- n 1))))))

(fact 10)

(fact 100)

(circle-area (fact 10))

(define first car)

(define rest cdr)

(define count (lambda (item L) (if L (+ (equal? item (first L)) (count item (rest L))) 0)))

(count 2 (list 0 0 0 2 3 0 0))

(count (quote the) (quote (the more the the merrier the bigger the better)))

(define twice (lambda (x) (* 2 x)))

(twice 5)

(define repeat (lambda (f) (lambda (x) (f (f x)))))

((repeat twice) 10)

((repeat (repeat twice)) 10)

((repeat (repeat (repeat twice))) 10)

((repeat (repeat (repeat (repeat twice)))) 10)

(pow 2 16)

(define fib (lambda (n) (if (< n 2) 1 (+ (fib (- n 1)) (fib (- n 2))))))

(define range (lambda (a b) (if (= a b) (quote ()) (cons a (range (+ a 1) b)))))

(range 0 10)

(map fib (range 0 10))

(map fib (range 0 20))
