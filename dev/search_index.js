var documenterSearchIndex = {"docs":
[{"location":"concepts/","page":"-","title":"-","text":"The majority of the concepts used in the initial implementation of this package come from a combination of research papers and research systems (the most notable in the Julia ecosystem is Gen). See Related Work for a comprehensive list of references.","category":"page"},{"location":"concepts/#Universal-probabilistic-programming","page":"-","title":"Universal probabilistic programming","text":"","category":"section"},{"location":"concepts/","page":"-","title":"-","text":"Probabilistic programming systems are classified according to their ability to express the subset of stochastic computable functions which form valid probability densities over program execution (in some interpretation). That's a terrible mouthful - but it's wide enough to conveniently capture systems which focus on Bayesian networks, as well assystems which capture a wider set of programs, which we will examine shortly. ","category":"page"},{"location":"concepts/","page":"-","title":"-","text":"Probabilistic programming systems which restrict allowable forms of control flow or recursion are referred to as first-order probabilistic programming systems. The support of the distribution over samples sites which a first-order program defines can be known at compile time - this implies that these programs can be translated safely to a static graph representation (a Bayesian network). This representation can also be attained if control flow can be unrolled using compiler techniques like constant propagation.","category":"page"},{"location":"concepts/","page":"-","title":"-","text":"A static graph representation is useful, but it's not sufficient to express all valid densities over program execution. Higher-order or universal probabilistic programming frameworks include the ability to handle stochasticity in control flow bounds and recursion. To achieve this generality, frameworks which support the ability to express these sorts of probabilistic programs are typically restricted to sampling-based inference methods (which reflects a duality between a compiler-based approach to model representation and an interpreter-based approach which requires a number of things to be determined at runtime). Modern systems blur the line between these approaches (see Gen's static DSL for example) when analysis or annotation can improve inference performance.","category":"page"},{"location":"concepts/#The-choice-map-abstraction","page":"-","title":"The choice map abstraction","text":"","category":"section"},{"location":"concepts/","page":"-","title":"-","text":"One important concept in the universal space is the notion of a mapping from call sites where random choices occur to the values at those sites. This map is called a choice map in most implementations (original representation in Bher). The semantic interpretation of a probabilistic program expressed in a framework which supports universal probabilistic programming via the choice map abstraction is a distribution over choice maps. Consider the following program, which expresses the geometric distribution in this framework:","category":"page"},{"location":"concepts/","page":"-","title":"-","text":"geo(p::Float64) = rand(:flip, Bernoulli, (p, )) == 1 ? 0 : 1 + rand(:geo, geo, p)","category":"page"},{"location":"concepts/","page":"-","title":"-","text":"Here, rand call sites are also given addresses and recursive calls produce a hierarchical address space. A sample from the distribution over choice maps for this program might produce the following map:","category":"page"},{"location":"concepts/","page":"-","title":"-","text":" :geo => :flip\n          val  = false\n\n flip\n          val  = false\n\n :geo => (:geo => :flip)\n          val  = false\n\n :geo => (:geo => (:geo => :flip))\n          val  = false\n\n :geo => (:geo => (:geo => (:geo => :flip)))\n          val  = true","category":"page"},{"location":"concepts/","page":"-","title":"-","text":"One simple question arises: what exactly does this distribution over choice maps look like in a mathematical sense? To answer this question, we have to ask how control flow and iteration language features affect the \"abstract space\" of the shape of the program trace. For the moment, we will consider only randomness which occurs explicitly at addresses in each method call (i.e. rand calls with distributions as target) - it turns out that we can safely focus on the shape of the trace in this case without loss of generalization. Randomness which occurs inside of a rand call where the target of the call is another method call can be handled by the same techniques we introduce to analyze the shape of a single method body without target calls. Let's make this concrete by analyzing the following program:","category":"page"},{"location":"concepts/","page":"-","title":"-","text":"function foo(x::Float64)\n    y = rand(:y, Normal, (x, 1.0))\n    if y > 1.0\n        z = rand(:z, Normal, (y, 1.0))\n    end\n    return y\nend","category":"page"},{"location":"concepts/","page":"-","title":"-","text":"So, there are basically two \"branches\" in the trace. One branch produces a distribution over the values of the addressed random variables","category":"page"},{"location":"concepts/","page":"-","title":"-","text":"P(y z x) = P(z  y)P(y  x)","category":"page"},{"location":"concepts/","page":"-","title":"-","text":"and the other branch produces a distribution:","category":"page"},{"location":"concepts/","page":"-","title":"-","text":"P(y  x) = P(y  x)","category":"page"},{"location":"concepts/","page":"-","title":"-","text":"but how do you express this as a valid measure itself? One way is to think about an auxiliary \"indicator\" measure over the possible sets of addresses in the program:","category":"page"},{"location":"concepts/","page":"-","title":"-","text":"P(A) textwhere A takes a set as a value","category":"page"},{"location":"concepts/","page":"-","title":"-","text":"We actually know a bit about the space of values of A and about this measure.  ","category":"page"},{"location":"concepts/","page":"-","title":"-","text":"The space of values is the powerset of the set of all addresses.\nThe measure P(A) is unknown, but if the program halts, it is normalized.","category":"page"},{"location":"concepts/","page":"-","title":"-","text":"So we can imagine that the generative process selects an A","category":"page"},{"location":"concepts/#Programming-the-distribution-over-choice-maps","page":"-","title":"Programming the distribution over choice maps","text":"","category":"section"},{"location":"concepts/","page":"-","title":"-","text":"When interacting with a probabilistic programming framework which utilizes the choice map abstraction, the programming model requires that the user keep unique properties of the desired distribution over choice maps in mind. Here are a set of key difference between classical parametric Bayesian models and universal probabilistic programs:","category":"page"},{"location":"concepts/#Inference","page":"-","title":"Inference","text":"","category":"section"},{"location":"examples/","page":"Examples","title":"Examples","text":"This page keeps a set of common model examples expressed in Jaynes.","category":"page"},{"location":"examples/#Bayesian-linear-regression","page":"Examples","title":"Bayesian linear regression","text":"","category":"section"},{"location":"examples/","page":"Examples","title":"Examples","text":"module BayesianLinearRegression\n\nusing Jaynes\nusing Distributions\n\nfunction bayeslinreg(N::Int)\n    σ = rand(:σ, InverseGamma(2, 3))\n    β = rand(:β, Normal(0.0, 1.0))\n    for x in 1:N\n        y = rand(:y => x, Normal(β*x, σ))\n    end\nend\n\n# Observations\nobs = [(:y => 1, 0.9), (:y => 2, 1.7), (:y => 3, 3.2), (:y => 4, 4.3)]\nsel = selection(obs)\n\n# SIR\n@time ps = importance_sampling(bayeslinreg, (length(obs), ); observations = sel, num_samples = 20000)\nnum_res = 5000\nresample!(ps, num_res)\n\n# Some parameter statistics\nmean_σ = sum(map(ps.calls) do cl\n    cl[:σ]\nend) / num_res\nprintln(\"Mean σ: $mean_σ\")\n\nmean_β = sum(map(ps.calls) do cl\n    cl[:β]\nend) / num_res\nprintln(\"Mean β: $mean_β\")\n\nend # module","category":"page"},{"location":"modeling_lang/","page":"Modeling language","title":"Modeling language","text":"The modeling language for Jaynes is...Julia! We don't require the use of macros to specify probabilistic models, because the tracer tracks code using introspection at the level of lowered (and IR) code.","category":"page"},{"location":"modeling_lang/","page":"Modeling language","title":"Modeling language","text":"However, this doesn't give you free reign to write anything with rand calls and expect it to compile to a valid probabilistic program. Here we outline a number of restrictions (which are echoed in Gen) which are required to allow inference to stay strictly Bayesian.","category":"page"},{"location":"modeling_lang/","page":"Modeling language","title":"Modeling language","text":"For branches with address spaces which intersect, the addresses in the intersection must have distributions with the same base measure. This means you cannot swap continuous for discrete or vice versa depending on which branch you're on.\nMutable state does not interact well with iterative inference (e.g. MCMC). Additionally, be careful about the support of your distributions in this regard. If you're going to use mutable state in your programs, use rand calls in a lightweight manner - only condition on distributions with constant support and be careful about MCMC.","category":"page"},{"location":"modeling_lang/#Vectorized-call-sites","page":"Modeling language","title":"Vectorized call sites","text":"","category":"section"},{"location":"modeling_lang/","page":"Modeling language","title":"Modeling language","text":"Jaynes also offers a set of primitive language features for creating vectorized call sites which are similar to the combinators of Gen. These special features are treated as simple \"functional\" higher-order functions","category":"page"},{"location":"modeling_lang/","page":"Modeling language","title":"Modeling language","text":"using Jaynes\n\nfunction bar(m, n)\n    x = rand(:x, Normal(m, 1.0))\n    q = rand(:q, Normal(x, 5.0))\n    z = rand(:z, Normal(n + q, 3.0))\n    return q, z\nend\n\nfunction foo()\n    x = foldr(rand, :x, bar, 10, 0.3, 3.0)\n    y = map(rand, :y, bar, x)\n    return y\nend\n\ncl = trace(foo)\ndisplay(cl.trace; show_values = true)","category":"page"},{"location":"modeling_lang/","page":"Modeling language","title":"Modeling language","text":"the foldr and map calls indicate to the tracer that the generation of randomness conforms to a computation pattern which can be vectorized. This allows the tracer to construct an efficient VectorizedCallSite which allows more efficient updates/regenerations than a \"black-box\" CallSite where the dependency information may not be known. This is a simple way for the user to increase the efficiency of inference algorithms, by informing the tracer of information which it can't derive on its own (at least for now 😺).","category":"page"},{"location":"modeling_lang/","page":"Modeling language","title":"Modeling language","text":"foldr requires that the user provide a function f with","category":"page"},{"location":"modeling_lang/","page":"Modeling language","title":"Modeling language","text":"f (X Y) rightarrow (X Y)","category":"page"},{"location":"modeling_lang/","page":"Modeling language","title":"Modeling language","text":"as well as a first argument which denotes the number of fold operations to compute (in the example above, 10). foldr will then iteratively compute the function, passing the return value as arguments to the next computation (from left to right).","category":"page"},{"location":"modeling_lang/","page":"Modeling language","title":"Modeling language","text":"map does not place requirements on the function f (other than the implicit requirements for valid programs, as described above) but does require that the arguments be a Vector with each element matching the signature of f. map then iteratively applies the function as a kernel for each element in the argument vector.","category":"page"},{"location":"","page":"Architecture","title":"Architecture","text":"Jaynes is an implementation of effect-oriented programming for probabilistic programming. Internally, the current implementation closely follows the design of Gen which also uses the notion of stateful execution contexts to produce the interfaces required for inference. In contrast to Gen (which provides powerful optimizations for programs written in the static DSL, Jaynes is focused on an optimized dynamic language which is equivalent to all of Julia. To address the dynamic analysis problems which arise as a function of this goal, Jaynes is implemented using IR introspection and metaprogramming. The long term goal of Jaynes is to implement optimization by default for dynamic programs, while providing a simple modeling and inference interface.","category":"page"},{"location":"","page":"Architecture","title":"Architecture","text":"info: Info\nJaynes uses many concepts from the design and implementation of Gen. First and foremost, I would recommend users of Jaynes become familiar with Gen - to understand the problems which Jaynes attempts to solve. The following papers may be useful in this regard:Gen: a general-purpose probabilistic programming system with programmable inference\nProbabilistic programming with programmable inference\nA new approach to probabilistic programming inference\nLightweight Implementations of probabilistic programming languages via transformational compilationIn the design space of compiler metaprogramming tools, IRTools and Cassette are also large influences on Jaynes. In particular, the former is a core component of the implementation.Jaynes has also been influenced by Turing, the Poutine effects system in Pyro, and Unison lang. Jaynes does not implement algebraic effects in a rigorous (or functional!) way, but the usage of execution contexts which control how certain method calls are executed is closely aligned with these concepts.","category":"page"},{"location":"#Implementation","page":"Architecture","title":"Implementation","text":"","category":"section"},{"location":"","page":"Architecture","title":"Architecture","text":"Jaynes is organized around a central IRTools dynamo","category":"page"},{"location":"","page":"Architecture","title":"Architecture","text":"@dynamo function (mx::ExecutionContext)(a...)\n    ir = IR(a...)\n    ir == nothing && return\n    recurse!(ir)\n    return ir\nend","category":"page"},{"location":"","page":"Architecture","title":"Architecture","text":"which defines how instances of inheritors of ExecutionContext act on function calls. There are a number of such inheritors","category":"page"},{"location":"","page":"Architecture","title":"Architecture","text":"HierarchicalTrace\nUnconstrainedGenerateContext\nConstrainedGenerateContext\nProposalContext\nUpdateContext\nRegenerateContext\nScoreContext","category":"page"},{"location":"","page":"Architecture","title":"Architecture","text":"each of which has a special dispatch definition which allows the dynamo to dispatch on rand calls with addressing e.g.","category":"page"},{"location":"","page":"Architecture","title":"Architecture","text":"@inline function (ctx::UnconstrainedGenerateContext)(call::typeof(rand), \n                                                     addr::T, \n                                                     d::Distribution{K}) where {T <: Address, K}\n    s = rand(d)\n    ctx.tr.chm[addr] = ChoiceSite(logpdf(d, s), s)\n    return s\nend","category":"page"},{"location":"","page":"Architecture","title":"Architecture","text":"for UnconstrainedGenerateContext. Each of the other contexts define a particular functionality required for inference over probabilistic program traces. ","category":"page"},{"location":"#Traces","page":"Architecture","title":"Traces","text":"","category":"section"},{"location":"","page":"Architecture","title":"Architecture","text":"The structured representation of traces is also an ExecutionContext","category":"page"},{"location":"","page":"Architecture","title":"Architecture","text":"abstract type Trace <: ExecutionContext end\n\nmutable struct HierarchicalTrace <: Trace\n    chm::Dict{Address, RecordSite}\n    score::Float64\n    function HierarchicalTrace()\n        new(Dict{Address, RecordSite}(), 0.0)\n    end\nend","category":"page"},{"location":"","page":"Architecture","title":"Architecture","text":"so usage for unconstrained generation is simple","category":"page"},{"location":"","page":"Architecture","title":"Architecture","text":"using Jaynes\ngeo(p::Float64) = rand(:flip, Bernoulli(p)) == 1 ? 0 : 1 + rand(:geo, geo, p)\ntr = Trace()\ntr(geo, 5.0)\ndisplay(tr, show_value = true)","category":"page"},{"location":"","page":"Architecture","title":"Architecture","text":"will produce","category":"page"},{"location":"","page":"Architecture","title":"Architecture","text":"  __________________________________\n\n               Addresses\n\n flip : false\n :geo => :flip : true\n  __________________________________","category":"page"},{"location":"#Inference","page":"Architecture","title":"Inference","text":"","category":"section"},{"location":"","page":"Architecture","title":"Architecture","text":"To express constraints associated with inference (or unconstrained selections required for MCMC), there is a Selection interface which can be used to communicate constraints to rand sites in compatible execution contexts.","category":"page"},{"location":"","page":"Architecture","title":"Architecture","text":"sel = selection((:flip, true))\nctx = Generate(Trace(), sel)\nctx(geo, 0.5)\ndisplay(ctx.tr, show_values = true)","category":"page"},{"location":"","page":"Architecture","title":"Architecture","text":"will produce","category":"page"},{"location":"","page":"Architecture","title":"Architecture","text":"  __________________________________\n\n               Addresses\n\n flip : true\n  __________________________________","category":"page"},{"location":"","page":"Architecture","title":"Architecture","text":"which constrains the execution to select that value for the random choice at address :flip. We can also communicate constraints to inference algorithms","category":"page"},{"location":"","page":"Architecture","title":"Architecture","text":"@time calls, lnw, lmle = Jaynes.importance_sampling(geo, (0.05, ); observations = sel)\nprintln(lmle)\n@time calls, lnw, lmle = Jaynes.importance_sampling(geo, (0.5, ); observations = sel)\nprintln(lmle)\n@time calls, lnw, lmle = Jaynes.importance_sampling(geo, (0.8, ); observations = sel)\nprintln(lmle)","category":"page"},{"location":"","page":"Architecture","title":"Architecture","text":"will produce","category":"page"},{"location":"","page":"Architecture","title":"Architecture","text":"  0.431258 seconds (1.49 M allocations: 78.267 MiB, 4.96% gc time)\n-2.9957322735539904\n  0.003901 seconds (80.04 k allocations: 4.476 MiB)\n-0.6931471805599454\n  0.004302 seconds (80.04 k allocations: 4.476 MiB)\n-0.2231435513142106","category":"page"},{"location":"","page":"Architecture","title":"Architecture","text":"which shows that the log marginal likelihood of the data increases as the parameter for the geometric generator increases (towards a value which is ultimately more likely given the data).","category":"page"},{"location":"#Black-box-extensions","page":"Architecture","title":"Black-box extensions","text":"","category":"section"},{"location":"","page":"Architecture","title":"Architecture","text":"Jaynes is equipped with the ability to extend the tracer to arbitrary black-box code, as long as the user can provide a logpdf for the call","category":"page"},{"location":"","page":"Architecture","title":"Architecture","text":"geo(p::Float64) = rand(:flip, Bernoulli(p)) ? 0 : 1 + rand(:geo, geo, p)\n@primitive function logpdf(fn::typeof(geo), p, count)\n    return Distributions.logpdf(Geometric(p), count)\nend\n\n\ncl = Jaynes.call(Trace(), rand, :geo, geo, 0.3)\ndisplay(cl.trace; show_values = true)","category":"page"},{"location":"","page":"Architecture","title":"Architecture","text":"will produce","category":"page"},{"location":"","page":"Architecture","title":"Architecture","text":"  __________________________________\n\n               Addresses\n\n geo : 4\n  __________________________________","category":"page"}]
}
