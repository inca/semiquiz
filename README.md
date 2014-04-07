# SemiQuiz — semantic quizzes toolkit

SemiQuiz is a set of tools for building HTML quizzes written in semantic plain text.
It is based on [Rho](https://github.com/inca/rho) -- modern plain-text-to-html
library.

Just look at the following samples to get the idea of what SemiQuiz is.

```
## Radio buttons (single choice)

2 + 3 = ?

( ) 3
( ) 4
(x) 5
( ) 6

## Checkboxes (multiple choices)

Check vowels:

[x] A
[ ] B
[ ] C
[ ] D
[x] E

## Select menus (single choice)

({Apple}{+Orange}{Banana}) is the fruit of the citrus species.

Winter is the ({hottest}{+coldest}) season of the year.

## Text inputs

1. 2 + 3 =    {{ 5  }}

2. 16 / 4 =   {{ 4  }}

3. 20 * 1.5 = {{ 30 }}
```

SemiQuiz can compile this example into an HTML form (for client-side)
with a companion JavaScript object (for server side). Later on, SemiQuiz can
be used to process the user's answer and return HTML fragment with review data
and some quick statistics.

## Philosophy & Contribution

SemiQuiz is intended to be **very** simple.

While it is technically possible to parse and implement lots of different quiz types,
we intentionally keep the syntax succinct and only support a handful of controls.

The are a few tenets each syntactic rule should obey:

  1. Understandability -- controls should have a clear and unambiguous meaning
     in the plain text, even for non-technical specialists.

  2. Keyboard-friendliness -- controls should be delimited with ASCII symbols.

  3. Brevity -- control delimiters should be minimalistic and memorable.

  4. Device-friendliness -- controls should be supported on mobile devices without
     complications.

We are always open to good ideas, though. When thinking up a syntax rule
try to ask yourself a few questions first:

  1. Is it really _that_ necessary to implement it?

  2. Is it possible to achieve the same goal some other way around (maybe by re-phrasing the question)?

  3. Is the syntax you're proposing readable, memorable and understandable?

  4. Is is easy to support the rendered markup on mobile devices?

If you can answer these questions, then please share your thoughts by
[posting an issue](https://github.com/inca/semiquiz).

## License

Copyright (C) 2013 Boris Okunskiy <boris@okunskiy.name> (MIT license)

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is furnished
to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE
OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
