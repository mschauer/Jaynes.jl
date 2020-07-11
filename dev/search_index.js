var documenterSearchIndex = {"docs":
[{"location":"contexts/","page":"Execution contexts","title":"Execution contexts","text":"CurrentModule = Jaynes","category":"page"},{"location":"contexts/","page":"Execution contexts","title":"Execution contexts","text":"GenerateContext","category":"page"},{"location":"contexts/#Jaynes.GenerateContext","page":"Execution contexts","title":"Jaynes.GenerateContext","text":"mutable struct GenerateContext{T <: Trace, K <: ConstrainedSelection} <: ExecutionContext\n    tr::T\n    select::K\n    weight::Float64\n    visited::Visitor\n    params::LearnableParameters\nend\n\nGenerateContext is used to generate traces, as well as record and accumulate likelihood weights given observations at addressed randomness.\n\nInner constructors:\n\nGenerateContext(tr::T, select::K) where {T <: Trace, K <: ConstrainedSelection} = new{T, K}(tr, select, 0.0, Visitor(), LearnableParameters())\nGenerateContext(tr::T, select::K, params) where {T <: Trace, K <: ConstrainedSelection} = new{T, K}(tr, select, 0.0, Visitor(), params)\n\nOuter constructors:\n\nGenerate(select::ConstrainedSelection) = GenerateContext(Trace(), select)\nGenerate(select::ConstrainedSelection, params) = GenerateContext(Trace(), select, params)\nGenerate(tr::Trace, select::ConstrainedSelection) = GenerateContext(tr, select)\n\n\n\n\n\n","category":"type"},{"location":"contexts/","page":"Execution contexts","title":"Execution contexts","text":"ProposeContext","category":"page"},{"location":"contexts/#Jaynes.ProposeContext","page":"Execution contexts","title":"Jaynes.ProposeContext","text":"mutable struct ProposeContext{T <: Trace} <: ExecutionContext\n    tr::T\n    weight::Float64\n    params::LearnableParameters\nend\n\nProposeContext is used to generate traces for inference algorithms which use custom proposals. ProposeContext instances can be passed sets of LearnableParameters to configure the propose with parameters which have been learned by differentiable programming.\n\nInner constructors:\n\nProposeContext(tr::T) where T <: Trace = new{T}(tr, 0.0, LearnableParameters())\n\nOuter constructors:\n\nPropose() = ProposeContext(Trace())\n\n\n\n\n\n","category":"type"},{"location":"contexts/","page":"Execution contexts","title":"Execution contexts","text":"ScoreContext","category":"page"},{"location":"contexts/","page":"Execution contexts","title":"Execution contexts","text":"UpdateContext","category":"page"},{"location":"contexts/","page":"Execution contexts","title":"Execution contexts","text":"RegenerateContext","category":"page"},{"location":"contexts/","page":"Execution contexts","title":"Execution contexts","text":"ParameterBackpropagateContext","category":"page"},{"location":"contexts/#Jaynes.ParameterBackpropagateContext","page":"Execution contexts","title":"Jaynes.ParameterBackpropagateContext","text":"mutable struct ParameterBackpropagateContext{T <: Trace} <: BackpropagationContext\n    tr::T\n    weight::Float64\n    visited::Visitor\n    params::ParameterStore\n    param_grads::Gradients\nend\n\nParameterBackpropagationContext is used to compute the gradients of parameters with respect to following objective:\n\nOuter constructors:\n\nParameterBackpropagate(tr::T, params) where T <: Trace = ParameterBackpropagateContext(tr, 0.0, Visitor(), params, Gradients())\nParameterBackpropagate(tr::T, params, param_grads::Gradients) where {T <: Trace, K <: UnconstrainedSelection} = ParameterBackpropagateContext(tr, 0.0, Visitor(), params, param_grads)\n\n\n\n\n\n","category":"type"},{"location":"fmi/","page":"Foreign model interface","title":"Foreign model interface","text":"Due to the design and implementation as an IR metaprogramming tool, Jaynes sits at a slightly privileged place in the probabilistic programming ecosystem, in the sense that many of the other languages which users are likely to use require the usage of macros to setup code in a way which allows the necessary state to be inserted for probabilistic programming functionality.","category":"page"},{"location":"fmi/","page":"Foreign model interface","title":"Foreign model interface","text":"Jaynes sees all the code after macro expansion is completed, which allows Jaynes to introspect function call sites after state has been inserted by other libraries. This allows the possibility for Jaynes to construct special call sites to represent calls into other probabilistic programming libraries. These interfaces are a work in progress, but Jaynes should theoretically provide a lingua franca for programs expressed in different probabilistic programming systems to communicate in a natural way, due to the nature of the context-oriented programming style facilitated by the system.","category":"page"},{"location":"fmi/#Black-box-extensions","page":"Foreign model interface","title":"Black-box extensions","text":"","category":"section"},{"location":"fmi/","page":"Foreign model interface","title":"Foreign model interface","text":"Jaynes is equipped with the ability to extend the tracer to arbitrary black-box code, as long as the user can provide a logpdf for the call","category":"page"},{"location":"fmi/","page":"Foreign model interface","title":"Foreign model interface","text":"geo(p::Float64) = rand(:flip, Bernoulli(p)) ? 0 : 1 + rand(:geo, geo, p)\n@primitive function logpdf(fn::typeof(geo), p, count)\n    return Distributions.logpdf(Geometric(p), count)\nend\n\n\ncl = Jaynes.call(Trace(), rand, :geo, geo, 0.3)\ndisplay(cl.trace; show_values = true)","category":"page"},{"location":"fmi/","page":"Foreign model interface","title":"Foreign model interface","text":"will produce","category":"page"},{"location":"fmi/","page":"Foreign model interface","title":"Foreign model interface","text":"  __________________________________\n\n               Addresses\n\n geo : 4\n  __________________________________","category":"page"},{"location":"inference/","page":"Inference","title":"Inference","text":"CurrentModule = Jaynes","category":"page"},{"location":"inference/","page":"Inference","title":"Inference","text":"importance_sampling","category":"page"},{"location":"inference/","page":"Inference","title":"Inference","text":"info: Info\nAddressed randomness in a custom proposal should satisfy the following criteria to ensure that inference is mathematically valid:Custom proposals should only propose to unobserved addresses in the original program.\nCustom proposals should not propose to addresses which do not occur in the original program.","category":"page"},{"location":"concepts/","page":"Concepts","title":"Concepts","text":"The majority of the concepts used in the initial implementation of this package come from a combination of research papers and research systems (the most notable in the Julia ecosystem is Gen). See Related Work for a more comprehensive list of references.","category":"page"},{"location":"concepts/#Universal-probabilistic-programming","page":"Concepts","title":"Universal probabilistic programming","text":"","category":"section"},{"location":"concepts/","page":"Concepts","title":"Concepts","text":"Probabilistic programming systems are classified according to their ability to express the subset of stochastic computable functions which form valid probability densities over program execution (in some interpretation). That's a terrible mouthful - but it's wide enough to conveniently capture systems which focus on Bayesian networks, as well assystems which capture a wider set of programs, which we will examine shortly. ","category":"page"},{"location":"concepts/","page":"Concepts","title":"Concepts","text":"Probabilistic programming systems which restrict allowable forms of control flow or recursion are referred to as first-order probabilistic programming systems. The support of the distribution over samples sites which a first-order program defines can be known at compile time - this implies that these programs can be translated safely to a static graph representation (a Bayesian network). This representation can also be attained if control flow can be unrolled using compiler techniques like constant propagation.","category":"page"},{"location":"concepts/","page":"Concepts","title":"Concepts","text":"A static graph representation is useful, but it's not sufficient to express all valid densities over program execution. Higher-order or universal probabilistic programming frameworks include the ability to handle stochasticity in control flow bounds and recursion. To achieve this generality, frameworks which support the ability to express these sorts of probabilistic programs are typically restricted to sampling-based inference methods (which reflects a duality between a compiler-based approach to model representation and an interpreter-based approach which requires a number of things to be determined at runtime). Modern systems blur the line between these approaches (see Gen's static DSL for example) when analysis or annotation can improve inference performance.","category":"page"},{"location":"concepts/#The-choice-map-abstraction","page":"Concepts","title":"The choice map abstraction","text":"","category":"section"},{"location":"concepts/","page":"Concepts","title":"Concepts","text":"One important concept in the universal space is the notion of a mapping from call sites where random choices occur to the values at those sites. This map is called a choice map in most implementations (original representation in Bher). The semantic interpretation of a probabilistic program expressed in a framework which supports universal probabilistic programming via the choice map abstraction is a distribution over choice maps. Consider the following program, which expresses the geometric distribution in this framework:","category":"page"},{"location":"concepts/","page":"Concepts","title":"Concepts","text":"geo(p::Float64) = rand(:flip, Bernoulli, (p, )) == 1 ? 0 : 1 + rand(:geo, geo, p)","category":"page"},{"location":"concepts/","page":"Concepts","title":"Concepts","text":"Here, rand call sites are also given addresses and recursive calls produce a hierarchical address space. A sample from the distribution over choice maps for this program might produce the following map:","category":"page"},{"location":"concepts/","page":"Concepts","title":"Concepts","text":" :geo => :flip : false\n flip : false\n :geo => (:geo => :flip) : false\n :geo => (:geo => (:geo => :flip)) : false\n :geo => (:geo => (:geo => (:geo => :flip))) : true","category":"page"},{"location":"concepts/","page":"Concepts","title":"Concepts","text":"One simple question arises: what exactly does this distribution over choice maps look like in a mathematical sense? To answer this question, we have to ask how control flow and iteration language features affect the \"abstract space\" of the shape of the program trace. For the moment, we will consider only randomness which occurs explicitly at addresses in each method call (i.e. rand calls with distributions as target) - it turns out that we can safely focus on the shape of the trace in this case without loss of generalization. Randomness which occurs inside of a rand call where the target of the call is another method call can be handled by the same techniques we introduce to analyze the shape of a single method body without target calls.","category":"page"},{"location":"concepts/#Choice-and-call-site-abstractions","page":"Concepts","title":"Choice and call site abstractions","text":"","category":"section"},{"location":"concepts/","page":"Concepts","title":"Concepts","text":"Ideally, we'd like the construction of probabilistic programs to parallel the construction of regular programs - we'd like the additional probabilistic semantics to leave the original execution semantics invariant (mostly). In other words, we don't want to give up the powerful abstractions and features which we have become accustomed to while programming in Julia normally. Well, there's good news - you don't have to! You will have to keep a few new things in mind (see the modeling language section for more details) but the whole language should remain open for your use.","category":"page"},{"location":"concepts/","page":"Concepts","title":"Concepts","text":"One of the ways which Jaynes accomplishes this is by creating a set of \"record site\" abstractions which denote places where the tracer can take over for the normal execution or call semantics which the programmer expects. This notion of an interception site is central to a number of compiler plug-in style systems (IRTools and Cassette included). Systems like these might see a call and intercept the call, possible replacing the call with another call with extra points of overloadability. Oh, I should also mention that these systems do this recursively through the call stack 😺. As far as I know, it is rare to be able to do this natively in languages. You definitely need your language to be dynamic and likely JIT compiled (so that you can access parts of the intermediate representation) - in other words, Julia.","category":"page"},{"location":"concepts/","page":"Concepts","title":"Concepts","text":"To facilitate probabilistic programming, Jaynes intercepts calls to rand (as you might have guessed) and interprets them differently depending on the execution context which the user calls on their toplevel function. The normal Julia execution context is activated by simply calling the toplevel function directly - but Jaynes provides access to a number of additional contexts which perform useful functionality for the design and implementation of sample-based inference algorithms. In general:","category":"page"},{"location":"concepts/","page":"Concepts","title":"Concepts","text":"When Jaynes sees an addressed rand site rand(:x, d) where d is a Distribution instance from the Distributions.jl package, it intercepts it and creates a ChoiceSite record of the interception as well as some metadata to facilitate inference. \nWhen Jaynes sees an addressed rand site rand(:x, fn, args...), it intercepts it and creates CallSite record of the interception, and then recurses into the call to find other points of interception.","category":"page"},{"location":"concepts/","page":"Concepts","title":"Concepts","text":"These are the two basic patterns which are repeated throughout the implementation of execution contexts.","category":"page"},{"location":"selection_interface/","page":"Selection interfaces","title":"Selection interfaces","text":"Jaynes features an extensive selection query language for addressing sources of randomness. The ability to constrain random choices, compute proposals for random choices in MCMC kernels, as well as gradients requires a solid set of interfaces for selecting addresses in rand calls in your program. Here, we present the main interfaces which you are likely to use.","category":"page"},{"location":"architecture/#Implementation","page":"Architecture","title":"Implementation","text":"","category":"section"},{"location":"architecture/","page":"Architecture","title":"Architecture","text":"Jaynes is organized around a central IRTools dynamo","category":"page"},{"location":"architecture/","page":"Architecture","title":"Architecture","text":"@dynamo function (mx::ExecutionContext)(a...)\n    ir = IR(a...)\n    ir == nothing && return\n    recur!(ir)\n    return ir\nend","category":"page"},{"location":"architecture/","page":"Architecture","title":"Architecture","text":"which defines how instances of inheritors of ExecutionContext act on function calls. There are a number of such inheritors","category":"page"},{"location":"architecture/","page":"Architecture","title":"Architecture","text":"GenerateContext\nProposalContext\nUpdateContext\nRegenerateContext\nScoreContext\nBackpropagateContext","category":"page"},{"location":"architecture/","page":"Architecture","title":"Architecture","text":"each of which has a special dispatch definition which allows the dynamo to dispatch on rand calls with addressing. As an example, here's the interception dispatch inside the GenerateContext","category":"page"},{"location":"architecture/","page":"Architecture","title":"Architecture","text":"@inline function (ctx::GenerateContext)(call::typeof(rand), \n                                        addr::T, \n                                        d::Distribution{K}) where {T <: Address, K}\n    if has_query(ctx.select, addr)\n        s = get_query(ctx.select, addr)\n        score = logpdf(d, s)\n        add_choice!(ctx.tr, addr, ChoiceSite(score, s))\n        increment!(ctx, score)\n    else\n        s = rand(d)\n        add_choice!(ctx.tr, addr, ChoiceSite(logpdf(d, s), s))\n    end\n    visit!(ctx.visited, addr)\n    return s\nend\n","category":"page"},{"location":"architecture/","page":"Architecture","title":"Architecture","text":"so this context records the random choice, as well as performs some bookkeeping which we use for inference. Each of the other contexts define unique interception dispatch to implement functionality required for inference over probabilistic program traces. ","category":"page"},{"location":"architecture/#Traces","page":"Architecture","title":"Traces","text":"","category":"section"},{"location":"architecture/","page":"Architecture","title":"Architecture","text":"The structured representation of program execution is a Trace","category":"page"},{"location":"architecture/","page":"Architecture","title":"Architecture","text":"abstract type Trace end\nmutable struct HierarchicalTrace <: Trace\n    calls::Dict{Address, CallSite}\n    choices::Dict{Address, ChoiceSite}\n    params::Dict{Address, LearnableSite}\n    score::Float64\n    function HierarchicalTrace()\n        new(Dict{Address, CallSite}(), \n            Dict{Address, ChoiceSite}(),\n            Dict{Address, LearnableSite}(),\n            0.0)\n    end\nend","category":"page"},{"location":"architecture/","page":"Architecture","title":"Architecture","text":"Here, I'm showing HierarchicalTrace which is the generic (and currently, only) trace type. We just encountered ChoiceSite above - let's look at an example CallSite","category":"page"},{"location":"architecture/","page":"Architecture","title":"Architecture","text":"mutable struct BlackBoxCallSite{T <: Trace, J, K} <: CallSite\n    trace::T\n    fn::Function\n    args::J\n    ret::K\nend","category":"page"},{"location":"architecture/","page":"Architecture","title":"Architecture","text":"This call site is how we represent black box function calls which the user has indicated need to be traced. Other call sites present unique functionality, which (when traced) provide the contexts used for inference with additional information which can speed up certain operations.","category":"page"},{"location":"modeling_lang/","page":"Modeling language","title":"Modeling language","text":"The modeling language for Jaynes is ... Julia! We don't require the use of macros to specify probabilistic models, because the tracer tracks code using introspection at the level of lowered (and IR) code.","category":"page"},{"location":"modeling_lang/","page":"Modeling language","title":"Modeling language","text":"However, this doesn't give you free reign to write anything with rand calls and expect it to compile to a valid probabilistic program. Here we outline a number of restrictions (which are echoed in Gen) which are required to allow inference to stay strictly Bayesian.","category":"page"},{"location":"modeling_lang/","page":"Modeling language","title":"Modeling language","text":"For branches with address spaces which intersect, the addresses in the intersection must have distributions with the same base measure. This means you cannot swap continuous for discrete or vice versa depending on which branch you're on.\nMutable state does not interact well with iterative inference (e.g. MCMC). Additionally, be careful about the support of your distributions in this regard. If you're going to use mutable state in your programs, use rand calls in a lightweight manner - only condition on distributions with constant support and be careful about MCMC.","category":"page"},{"location":"modeling_lang/#Vectorized-call-sites","page":"Modeling language","title":"Vectorized call sites","text":"","category":"section"},{"location":"modeling_lang/","page":"Modeling language","title":"Modeling language","text":"Jaynes also offers a set of primitive language features for creating vectorized call sites which are similar to the combinators of Gen. These special features are treated as simple \"functional\" higher-order functions","category":"page"},{"location":"modeling_lang/","page":"Modeling language","title":"Modeling language","text":"using Jaynes\n\nfunction bar(m, n)\n    x = rand(:x, Normal(m, 1.0))\n    q = rand(:q, Normal(x, 5.0))\n    z = rand(:z, Normal(n + q, 3.0))\n    return q, z\nend\n\nfunction foo()\n    x = foldr(rand, :x, bar, 10, 0.3, 3.0)\n    y = map(rand, :y, bar, x)\n    return y\nend\n\ncl = trace(foo)\ndisplay(cl.trace; show_values = true)","category":"page"},{"location":"modeling_lang/","page":"Modeling language","title":"Modeling language","text":"the foldr and map calls indicate to the tracer that the generation of randomness conforms to a computation pattern which can be vectorized. This allows the tracer to construct an efficient VectorizedCallSite which allows more efficient updates/regenerations than a \"black-box\" CallSite where the dependency information may not be known. This is a simple way for the user to increase the efficiency of inference algorithms, by informing the tracer of information which it can't derive on its own (at least for now 😺).","category":"page"},{"location":"modeling_lang/","page":"Modeling language","title":"Modeling language","text":"foldr requires that the user provide a function f with","category":"page"},{"location":"modeling_lang/","page":"Modeling language","title":"Modeling language","text":"f (X Y) rightarrow (X Y)","category":"page"},{"location":"modeling_lang/","page":"Modeling language","title":"Modeling language","text":"as well as a first argument which denotes the number of fold operations to compute (in the example above, 10). foldr will then iteratively compute the function, passing the return value as arguments to the next computation (from left to right).","category":"page"},{"location":"modeling_lang/","page":"Modeling language","title":"Modeling language","text":"map does not place requirements on the function f (other than the implicit requirements for valid programs, as described above) but does require that the arguments be a Vector with each element matching the signature of f. map then iteratively applies the function as a kernel for each element in the argument vector.","category":"page"},{"location":"related_work/","page":"Related work","title":"Related work","text":"Jaynes is a context-oriented programming system for probabilistic programming. Internally, the current implementation closely follows the design of Gen which also uses the notion of stateful execution contexts to produce the interfaces required for inference. ","category":"page"},{"location":"related_work/","page":"Related work","title":"Related work","text":"In contrast to Gen (which provides powerful optimizations for programs written in the static DSL), Jaynes is focused on an optimized dynamic language which allows most of the Julia language to be used in expressing probabilistic programs.","category":"page"},{"location":"related_work/","page":"Related work","title":"Related work","text":"Jaynes uses many concepts from the design and implementation of Gen. First and foremost, I would recommend users of Jaynes become familiar with Gen - to understand the problems which Jaynes attempts to solve. The following papers may be useful in this regard:","category":"page"},{"location":"related_work/","page":"Related work","title":"Related work","text":"Gen: a general-purpose probabilistic programming system with programmable inference\nProbabilistic programming with programmable inference\nA new approach to probabilistic programming inference\nLightweight Implementations of probabilistic programming languages via transformational compilation","category":"page"},{"location":"related_work/","page":"Related work","title":"Related work","text":"In the design space of compiler metaprogramming tools, the following systems have been highly influential in the design of Jaynes","category":"page"},{"location":"related_work/","page":"Related work","title":"Related work","text":"IRTools\nCassette","category":"page"},{"location":"related_work/","page":"Related work","title":"Related work","text":"In particular, IRTools provides thecore infrastructure for the implementation. Strictly speaking, Jaynes is not dependent on some fundamental mechanism which IRTools provides (only generated functions from Julia) but IRTools greatly reduces the level of risk in working with generated functions and lowered code.","category":"page"},{"location":"related_work/","page":"Related work","title":"Related work","text":"Jaynes has also been influenced by Turing, the Poutine effects system in Pyro, and Unison lang. Jaynes does not implement algebraic effects in a rigorous (or static!) way, but the usage of execution contexts which control how certain method calls are executed is closely aligned with these concepts.","category":"page"},{"location":"related_work/","page":"Related work","title":"Related work","text":"Finally, the probabilistic programming community in Julia is largely responsible for many of the ideas and conversations which lead to Jaynes. I'd like to thank Chad Scherrer, Martin Trapp, Alex Lew, Jarred Barber, George Matheos, Marco Cusumano-Towner, Ari Katz, Philipp Gabler, Valentin Churavy, Mike Innes, and Lyndon White for auxiliary help and discussion concerning the design and implementation of many parts of the system.","category":"page"},{"location":"diff_prog/","page":"Differentiable programming","title":"Differentiable programming","text":"CurrentModule = Jaynes","category":"page"},{"location":"diff_prog/","page":"Differentiable programming","title":"Differentiable programming","text":"Jaynes supports Zygote-based reverse mode gradient computation of learnable parameters and primitive probabilistic choices. This functionality is accessed through two different gradient contexts.","category":"page"},{"location":"diff_prog/","page":"Differentiable programming","title":"Differentiable programming","text":"ParameterBackpropagateContext","category":"page"},{"location":"diff_prog/","page":"Differentiable programming","title":"Differentiable programming","text":"For one-shot gradient computations, this context is easily accessed through the get_parameter_gradients method.","category":"page"},{"location":"diff_prog/","page":"Differentiable programming","title":"Differentiable programming","text":"get_parameter_gradients","category":"page"},{"location":"diff_prog/","page":"Differentiable programming","title":"Differentiable programming","text":"For choices, the context is ChoiceBackpropagateContext.","category":"page"},{"location":"diff_prog/","page":"Differentiable programming","title":"Differentiable programming","text":"ChoiceBackpropagateContext","category":"page"},{"location":"diff_prog/","page":"Differentiable programming","title":"Differentiable programming","text":"For one-shot gradient computations on choices, the ChoiceBackpropagateContext is easily accessed through the get_choice_gradients method.","category":"page"},{"location":"diff_prog/","page":"Differentiable programming","title":"Differentiable programming","text":"get_choice_gradients","category":"page"},{"location":"diff_prog/","page":"Differentiable programming","title":"Differentiable programming","text":"In the future, Jaynes will support a context which allows the automatic training of neural network components (Flux.jl or otherwise) facilitated by custom call sites. See the foreign model interface for more details.","category":"page"},{"location":"examples/","page":"Examples","title":"Examples","text":"This page keeps a set of common model examples expressed in Jaynes.","category":"page"},{"location":"examples/#Bayesian-linear-regression","page":"Examples","title":"Bayesian linear regression","text":"","category":"section"},{"location":"examples/","page":"Examples","title":"Examples","text":"module BayesianLinearRegression\n\nusing Jaynes\nusing Distributions\n\nfunction bayeslinreg(N::Int)\n    σ = rand(:σ, InverseGamma(2, 3))\n    β = rand(:β, Normal(0.0, 1.0))\n    for x in 1:N\n        y = rand(:y => x, Normal(β*x, σ))\n    end\nend\n\n# Observations\nobs = [(:y => 1, 0.9), (:y => 2, 1.7), (:y => 3, 3.2), (:y => 4, 4.3)]\nsel = selection(obs)\n\n# SIR\n@time ps = importance_sampling(bayeslinreg, (length(obs), ); observations = sel, num_samples = 20000)\nnum_res = 5000\nresample!(ps, num_res)\n\n# Some parameter statistics\nmean_σ = sum(map(ps.calls) do cl\n    cl[:σ]\nend) / num_res\nprintln(\"Mean σ: $mean_σ\")\n\nmean_β = sum(map(ps.calls) do cl\n    cl[:β]\nend) / num_res\nprintln(\"Mean β: $mean_β\")\n\nend # module","category":"page"},{"location":"examples/#Backpropagation-for-choices-and-learnable-parameters","page":"Examples","title":"Backpropagation for choices and learnable parameters","text":"","category":"section"},{"location":"examples/","page":"Examples","title":"Examples","text":"module Learnable\n\nusing Jaynes\nusing Distributions\n\nfunction foo(q::Float64)\n    p = learnable(:l, 10.0)\n    z = rand(:z, Normal(p, q))\n    return z\nend\n\nfunction bar(x::Float64, y::Float64)\n    l = learnable(:l, 5.0)\n    m = learnable(:m, 10.0)\n    q = rand(:q, Normal(l, y + m))\n    f = rand(:f, foo, 5.0)\n    return f\nend\n\ncl = trace(bar, 5.0, 1.0)\n\nparams = get_parameters(cl)\nprintln(\"Parameters:\\n$(params)\")\n\ngrads = get_parameter_gradients(cl, 1.0)\nprintln(\"\\nParameter gradients:\\n$(grads)\")\n\ngrads = get_choice_gradients(cl, 1.0)\nprintln(\"\\nChoice gradients:\\n$(grads)\")\n\nend # module","category":"page"},{"location":"","page":"Introduction","title":"Introduction","text":"This is the documentation for the Jaynes probabilistic programming system.","category":"page"},{"location":"","page":"Introduction","title":"Introduction","text":"If you are familiar with probabilistic programming, you might start with Modeling Language, move into Architecture, and then into execution contexts in the library API reference.","category":"page"},{"location":"","page":"Introduction","title":"Introduction","text":"If you're new to probabilistic programming, you might start with Concepts.","category":"page"},{"location":"","page":"Introduction","title":"Introduction","text":"Bon appetit!","category":"page"}]
}
