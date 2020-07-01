var documenterSearchIndex = {"docs":
[{"location":"summary/#Summary","page":"Summary","title":"Summary","text":"","category":"section"},{"location":"summary/","page":"Summary","title":"Summary","text":"This page is designed to bring those familiar with the ecosystem up to speed quickly. If you're interesting in the design and implementation of the system, please proceed into the documentation.","category":"page"},{"location":"summary/","page":"Summary","title":"Summary","text":"","category":"page"},{"location":"summary/","page":"Summary","title":"Summary","text":"Currently, Jaynes supports a dynamic modeling DSL which is syntactically close (and semantically equivalent) to the dynamic DSL in Gen. This comes with a few performance caveats:","category":"page"},{"location":"summary/","page":"Summary","title":"Summary","text":"It is partially optimized. I've chosen representations which minimize allocations via profiling - but there are still upstream issues which affect performance on certain programs.\nThere are few performance guarantees on programs with type instabilities. Because this package relies on Cassette, it comes with all the subtle type performance issues that Cassette comes with.","category":"page"},{"location":"summary/","page":"Summary","title":"Summary","text":"Currently supported inference algorithms for this DSL:","category":"page"},{"location":"summary/","page":"Summary","title":"Summary","text":"[X] Importance sampling\n[X] Particle filtering\n[X] Metropolis-Hastings (Testing)","category":"page"},{"location":"summary/","page":"Summary","title":"Summary","text":"","category":"page"},{"location":"summary/","page":"Summary","title":"Summary","text":"Broken by effects merge to enable robust selection querying language, re-working:","category":"page"},{"location":"summary/","page":"Summary","title":"Summary","text":"[ ] Programmable MCMC (WIP)\n[X] Inference compilation\n[X] Gradient-based methods","category":"page"},{"location":"summary/","page":"Summary","title":"Summary","text":"","category":"page"},{"location":"summary/","page":"Summary","title":"Summary","text":"The dynamic DSL is not the the long term main feature of this system. Gen's version is better optimized, has better documentation, and has a better assortment of inference algorithms. Jaynes aims to support a restricted graph-based DSL which allows the user to utilize graphical model inference algorithms. Ideally, Jaynes should be able to identify when a program is amenable to this static representation. This is a WIP, and requires a bit more research at the IR level. The goal for this DSL is to seamlessly combine with the dynamic, sample-based DSL in a productive way.","category":"page"},{"location":"summary/#Extending-*Jaynes*","page":"Summary","title":"Extending Jaynes","text":"","category":"section"},{"location":"summary/","page":"Summary","title":"Summary","text":"Jaynes is equipped with the ability to extend the tracing interface to black-box code. This is naturally facilitated by the metaprogramming capabilities of Cassette. The primary usage of this extension is to define new logpdf method definitions for code which may contain sources of randomness which are not annotated with addresses and/or where inspection by the tracing mechanism can be safely abstracted over. Thus, @primitive defines a contract between the user and the tracer - we assume that what you're doing is correct and we're not going to check you on it!","category":"page"},{"location":"summary/","page":"Summary","title":"Summary","text":"The following example shows how this extension mechanism works.","category":"page"},{"location":"summary/","page":"Summary","title":"Summary","text":"using Jaynes: @primitive, Trace, Generate, trace\n\nfunction foo(y::Float64)\n    # Untraced randomness.\n    y = rand(Normal(0.5, 3.0))\n    return y\nend\n\n@primitive function logpdf(fn::typeof(foo), args::Tuple{Float64}, y::Float64)\n    if y < 1.0\n        log(1) \n    else\n        -Inf\n    end\nend\n\nfunction bar(z::Float64)\n    y = rand(:y, foo, (z, ))\n    return y\nend\n\nctx = Generate(Trace())\nret = trace(ctx, bar, (0.3, ))\nprintln(ctx.metadata.tr)\n\n#  __________________________________\n#\n#               Playback\n#\n# y\n#          val  = 2.8607525733342767\n#\n#  __________________________________\n#\n# score : 0.0\n#\n#  __________________________________\n","category":"page"},{"location":"summary/","page":"Summary","title":"Summary","text":"@primitive requires that the user define a logpdf definition for the call. This expands into overdub method definitions for the tracer which automatically work with all the core library context/metadata dispatch. The signature for logpdf should match the following type specification:","category":"page"},{"location":"summary/","page":"Summary","title":"Summary","text":"logpdf(::typeof(your_func), ::Tuple, ::T)","category":"page"},{"location":"summary/","page":"Summary","title":"Summary","text":"where T is the return type of your_func. ","category":"page"},{"location":"summary/","page":"Summary","title":"Summary","text":"Note that, if your defined logpdf is differentiable - gradients will automatically be derived for use in Gradient learning contexts as long as Zygote can differentiate through it. This can be used to e.g. train neural networks in Gradient contexts where the loss is wrapped in the logpdf/@primitive interface mechanism.","category":"page"},{"location":"summary/","page":"Summary","title":"Summary","text":"The extension mechanism does not check if the user-defined logpdf is valid. This mechanism also overrides the normal fallback (i.e. tracing into calls) for any function for which the mechanism is used to write a logpdf - this means that if you write a logpdf using this mechanism for a call and there is addressed randomness in the call, it will be ignored by the tracer.","category":"page"},{"location":"summary/#Examples","page":"Summary","title":"Examples","text":"","category":"section"},{"location":"summary/","page":"Summary","title":"Summary","text":"Please see the Examples directory in source. Eventually, this will be built and run for CI - but right now, the syntax is not stable and may change for certain programs.","category":"page"},{"location":"summary/#Acknowledgements","page":"Summary","title":"Acknowledgements","text":"","category":"section"},{"location":"summary/","page":"Summary","title":"Summary","text":"The ideas which are going into this package would not have been possible without numerous conversations with very smart people in the Julia community and beyond. I would like to acknowledge the following people","category":"page"},{"location":"summary/","page":"Summary","title":"Summary","text":"Jarred Barber, Alex Lew, Marco Cusumano-Towner, Ben Sherman, Jarrett Revels, Valentin Churavy, George Matheos, Chad Scherrer, Martin Trapp, Philipp Gabler, Lyndon White, Mike Innes, and Ari Katz...amongst many others in the probabilistic programming community.","category":"page"},{"location":"summary/","page":"Summary","title":"Summary","text":"as well as the following systems","category":"page"},{"location":"summary/","page":"Summary","title":"Summary","text":"Gen, Turing, Soss, Pyro, Unison, Cassette and Zygote.","category":"page"},{"location":"summary/","page":"Summary","title":"Summary","text":"","category":"page"},{"location":"concepts/","page":"-","title":"-","text":"The majority of the concepts used in the initial implementation of this package come from a combination of research papers and research systems (the most notable in the Julia ecosystem is Gen). See Related Work for a comprehensive list of references.","category":"page"},{"location":"concepts/#Universal-probabilistic-programming","page":"-","title":"Universal probabilistic programming","text":"","category":"section"},{"location":"concepts/","page":"-","title":"-","text":"Probabilistic programming systems are classified according to their ability to express the subset of stochastic computable functions which form valid probability densities over program execution (in some interpretation). That's a terrible mouthful - but it's wide enough to conveniently capture systems which focus on Bayesian networks, as well assystems which capture a wider set of programs, which we will examine shortly. ","category":"page"},{"location":"concepts/","page":"-","title":"-","text":"Probabilistic programming systems which restrict allowable forms of control flow or recursion are referred to as first-order probabilistic programming systems. The support of the distribution over samples sites which a first-order program defines can be known at compile time - this implies that these programs can be translated safely to a static graph representation (a Bayesian network). This representation can also be attained if control flow can be unrolled using compiler techniques like constant propagation.","category":"page"},{"location":"concepts/","page":"-","title":"-","text":"A static graph representation is useful, but it's not sufficient to express all valid densities over program execution. Higher-order or universal probabilistic programming frameworks include the ability to handle stochasticity in control flow bounds and recursion. To achieve this generality, frameworks which support the ability to express these sorts of probabilistic programs are typically restricted to sampling-based inference methods (which reflects a duality between a compiler-based approach to model representation and an interpreter-based approach which requires a number of things to be determined at runtime). Modern systems blur the line between these approaches (see Gen's static DSL for example) when analysis or annotation can improve inference performance.","category":"page"},{"location":"concepts/#The-choice-map-abstraction","page":"-","title":"The choice map abstraction","text":"","category":"section"},{"location":"concepts/","page":"-","title":"-","text":"One important concept in the universal space is the notion of a mapping from call sites where random choices occur to the values at those sites. This map is called a choice map in most implementations (original representation in Bher). The semantic interpretation of a probabilistic program expressed in a framework which supports universal probabilistic programming via the choice map abstraction is a distribution over choice maps. Consider the following program, which expresses the geometric distribution in this framework:","category":"page"},{"location":"concepts/","page":"-","title":"-","text":"geo(p::Float64) = rand(:flip, Bernoulli, (p, )) == 1 ? 0 : 1 + rand(:geo, geo, p)","category":"page"},{"location":"concepts/","page":"-","title":"-","text":"Here, rand call sites are also given addresses and recursive calls produce a hierarchical address space. A sample from the distribution over choice maps for this program might produce the following map:","category":"page"},{"location":"concepts/","page":"-","title":"-","text":" :geo => :flip\n          val  = false\n\n flip\n          val  = false\n\n :geo => (:geo => :flip)\n          val  = false\n\n :geo => (:geo => (:geo => :flip))\n          val  = false\n\n :geo => (:geo => (:geo => (:geo => :flip)))\n          val  = true","category":"page"},{"location":"concepts/","page":"-","title":"-","text":"One simple question arises: what exactly does this distribution over choice maps look like in a mathematical sense? To answer this question, we have to ask how control flow and iteration language features affect the \"abstract space\" of the shape of the program trace. For the moment, we will consider only randomness which occurs explicitly at addresses in each method call (i.e. rand calls with distributions as target) - it turns out that we can safely focus on the shape of the trace in this case without loss of generalization. Randomness which occurs inside of a rand call where the target of the call is another method call can be handled by the same techniques we introduce to analyze the shape of a single method body without target calls. Let's make this concrete by analyzing the following program:","category":"page"},{"location":"concepts/","page":"-","title":"-","text":"function foo(x::Float64)\n    y = rand(:y, Normal, (x, 1.0))\n    if y > 1.0\n        z = rand(:z, Normal, (y, 1.0))\n    end\n    return y\nend","category":"page"},{"location":"concepts/","page":"-","title":"-","text":"So, there are basically two \"branches\" in the trace. One branch produces a distribution over the values of the addressed random variables","category":"page"},{"location":"concepts/","page":"-","title":"-","text":"P(y z x) = P(z  y)P(y  x)","category":"page"},{"location":"concepts/","page":"-","title":"-","text":"and the other branch produces a distribution:","category":"page"},{"location":"concepts/","page":"-","title":"-","text":"P(y  x) = P(y  x)","category":"page"},{"location":"concepts/","page":"-","title":"-","text":"but how do you express this as a valid measure itself? One way is to think about an auxiliary \"indicator\" measure over the possible sets of addresses in the program:","category":"page"},{"location":"concepts/","page":"-","title":"-","text":"P(A) textwhere A takes a set as a value","category":"page"},{"location":"concepts/","page":"-","title":"-","text":"We actually know a bit about the space of values of A and about this measure.  ","category":"page"},{"location":"concepts/","page":"-","title":"-","text":"The space of values is the powerset of the set of all addresses.\nThe measure P(A) is unknown, but if the program halts, it is normalized.","category":"page"},{"location":"concepts/","page":"-","title":"-","text":"So we can imagine that the generative process selects an A","category":"page"},{"location":"concepts/#Programming-the-distribution-over-choice-maps","page":"-","title":"Programming the distribution over choice maps","text":"","category":"section"},{"location":"concepts/","page":"-","title":"-","text":"When interacting with a probabilistic programming framework which utilizes the choice map abstraction, the programming model requires that the user keep unique properties of the desired distribution over choice maps in mind. Here are a set of key difference between classical parametric Bayesian models and universal probabilistic programs:","category":"page"},{"location":"concepts/#Inference","page":"-","title":"Inference","text":"","category":"section"},{"location":"contextual_DSLs/","page":"-","title":"-","text":"Often times, developers of machine learning systems must construct domain-specific languages to express restrictions which are required by the system, but can't be expressed solely through the type system. An excellent example is MCMC kernel DSLs (or Gaussian process kernel DSLs) where a set of mathematical restrictions (which cannot be enforced by the compiler) must apply to user code for the code to qualify as valid in the kernel interpretation. Restricted languages which enable efficient (and cohesive) automatic differentiation are another example. ","category":"page"},{"location":"contextual_DSLs/","page":"-","title":"-","text":"One of the dominant methodologies in languages with macro systems is to construct the DSL using macros. The library can check at macro-expansion time if the user has utilized syntax or language features which are disallowed by the DSL, returning immediately to the user to express an error or issue. In extreme cases, the user may only be allowed to use other macros (which represent primitive features of the DSL) inside the DSL macro. Because Jaynes aims for a broad standard of composability as a plugin to the compiler, we prefer a complementary viewpoint which \"carves\" the DSL out of the host language. This viewpoint can also be found in the philosophy of packages such as Zygote where the user is allowed to write arbitrary code, but may encounter a runtime error if Zygote is unable to identify and emit pullback code for a method call (i.e. the user has stepped outside the bounds of the language (or set of ChainRules) which the system knows how to differentiate). ","category":"page"},{"location":"contextual_DSLs/","page":"-","title":"-","text":"We call our approach to this viewpoint contextual domain-specific languages because the inclusion of any language feature representable by a method call is handled by the interpretation context. The interpretation context contains a \"language core\" which is a piece of metadata which tells the interpreter what method calls are allowed in the DSL. These cores have a natural set of operations: set intersection is the minimal feature set which is compatible with both languages, where union is the set which covers both. Interpretation without a core is just interpretation of the entire host language in the context - nothing is excluded.","category":"page"},{"location":"contextual_DSLs/","page":"-","title":"-","text":"In our system, these languages are only active for specific contexts (i.e. those associated with the validation of construction of kernels or programming in the graphical model DSL) - so this section is purely optional. These languages are designed to help a user construct a program which is valid according to the assumptions of the domain - but they incur a small runtime cost (equivalent to normal Cassette execution with a call to prehook before overdub). For inference contexts, these language restrictions can be turned on and off by the user.","category":"page"},{"location":"contextual_DSLs/","page":"-","title":"-","text":"","category":"page"},{"location":"contextual_DSLs/","page":"-","title":"-","text":"As an example of this idea, here's a small functional core which performs runtime checks to prevent the use of mutation on mutable structures or key-accessed collections:","category":"page"},{"location":"contextual_DSLs/","page":"-","title":"-","text":"ctx = DomainCtx(metadata = Language(BaseLang()))\n\nmutable struct Foo\n    x::Float64\nend\n\nfunction foo(z::Float64)\n    z = Foo(10.0)\n    x = 10\n    if x < 15\n        y = 20\n    end\n    y += 1\n    z.x = 10.0\n    return y\nend\n\n# Accepted!\nret = interpret(ctx, foo, 5.0)\n\n@corrode! BaseLang setfield!\n@corrode! BaseLang setproperty!\n@corrode! BaseLang setindex!\n\n# Rejected!\nret = interpret(ctx, foo, 5.0)\n\n# ERROR: LoadError: Main.LanguageCores.Jaynes.BaseLangError: setproperty! with Tuple{Main.LanguageCores.Foo,Symbol,Float64} is disallowed in this language.","category":"page"},{"location":"contextual_DSLs/","page":"-","title":"-","text":"BaseLang lets all calls through. We corrode BaseLang to prevent calls to setfield!, setproperty!, and setindex!. Note that, at the method level, we can't prevent re-assignment to variables because assignment is not a method. If we wanted to, we could prevent this using an IR pass. We could extend this to prevent iteration-based control flow:","category":"page"},{"location":"contextual_DSLs/","page":"-","title":"-","text":"function foo(z::Float64)\n    z = Foo(10.0)\n    x = 10\n    for i in 1:10\n        println(i)\n    end\n    if x < 15\n        y = 20\n    end\n    y += 1\n    z.x = 10.0\n    return y\nend\n\n@corrode! BaseLang iterate\n\n# Rejected!\nret = interpret(ctx, foo, 5.0)\n\n# ERROR: LoadError: Main.LanguageCores.Jaynes.BaseLangError: iterate with Tuple{UnitRange{Int64}} is disallowed in this language.","category":"page"},{"location":"static/#Static-analysis","page":"Static analysis","title":"Static analysis","text":"","category":"section"},{"location":"static/","page":"Static analysis","title":"Static analysis","text":"One of the powerful benefits of the compiler plugin approach is the ability to derive additional analysis information, which can be used to structure the Trace representation of the program. ","category":"page"},{"location":"static/","page":"Static analysis","title":"Static analysis","text":"Jaynes features a set of Trace representations which \"fill in\" the call structure of programs which users are likely to write. The most general representation is HierarchicalTrace which features no metadata about the program. This is the default Trace representation for calls where we cannot determine the exact address space at compile time (e.g. loops require runtime information, or rely on randomness). VectorizedTrace is a representation which is used by Jaynes effects (which are semantically similar to the combinators of Gen). These effects amount to annotations by the programmer that the randomness flow satisfies a set of constraints which allows the construction of a specialized Trace form.","category":"page"},{"location":"static/","page":"Static analysis","title":"Static analysis","text":"The most performant Trace representation requires a compile-time call graph analysis which we elaborate below. This analysis is performed by default for all model programs which the user writes. This analysis is utilized by the tracing system at runtime to construct an optimal Trace representation which is a combination of the above trace types.","category":"page"},{"location":"static/#Specialized-trace-types","page":"Static analysis","title":"Specialized trace types","text":"","category":"section"},{"location":"static/","page":"Static analysis","title":"Static analysis","text":"Jaynes utilizes a particular transformation to derive an optimal representation for the Trace. The resultant Analysis representation is used at runtime to construct optimal trace representations for each call. Below, we outline the static pass, and briefly cover how the specialized GraphTrace can be used to cache computations, and identify when calls do not need to be re-computed.","category":"page"},{"location":"gradients/#Differentiable-programming","page":"Differentiable programming","title":"Differentiable programming","text":"","category":"section"},{"location":"gradients/","page":"Differentiable programming","title":"Differentiable programming","text":"Jaynes contains a number of components which utilize or allow for differentiable programming. At the highest level, learnable parameters can be declared by passing literals into rand calls. These declarations are not used in contexts parametrized by inference and tracing metadata, but have a special interpretation in contexts parametrized by GradientMeta instances.","category":"page"},{"location":"gradients/#Learnable-parameters","page":"Differentiable programming","title":"Learnable parameters","text":"","category":"section"},{"location":"gradients/","page":"Differentiable programming","title":"Differentiable programming","text":"# Literals are tracked as trainable.\nx = rand(:x, 10.0)\nt = rand(:t, 7.0)","category":"page"},{"location":"gradients/","page":"Differentiable programming","title":"Differentiable programming","text":"This informally represents a sort of delta distribution with initial parameter equal to the literal. You might imagine constructing a program foo1 with learnable parameters:","category":"page"},{"location":"gradients/","page":"Differentiable programming","title":"Differentiable programming","text":"function foo1()\n    # Literals are tracked as trainable.\n    x = rand(:x, 10.0)\n    t = rand(:t, 7.0)\n    cat_p = rand(:cat_p, 0.2)\n\n    # Rand calls on distributions also get tracked and the dependency graph is created.\n    y = rand(:y, Normal, (x, 1.0))\n    z = rand(:z, Normal, (t, 3.0))\n    cat = rand(:cat, Categorical, ([cat_p, 1 - cat_p], ))\n    for i in 1:10\n        if cat == 1\n            q = rand(:q => i, Normal, (5.0, 1.0))\n        else\n            q = rand(:q => i, Normal, (8.0, 1.0))\n        end\n    end\n    return z\nend","category":"page"},{"location":"gradients/","page":"Differentiable programming","title":"Differentiable programming","text":"The natural objective is the logpdf of a trace over the execution of this program. We might generate traces from another program, and perform gradient-based learning to maximize the logpdf of the model program with learnable parameters.","category":"page"},{"location":"gradients/","page":"Differentiable programming","title":"Differentiable programming","text":"function foo2()\n    x = rand(:x, 1.0)\n    y = rand(:y, Normal, (x, 1.0))\n    z = rand(:z, Normal, (x + 10, 13.0))\n    cat = rand(:cat, Categorical, ([0.5, 0.5],))\n    for i in 1:10\n        if cat == 1\n            q = rand(:q => i, Normal, (5.0, 1.0))\n        else\n            q = rand(:q => i, Normal, (10.0, 1.0))\n        end\n    end\n    return z\nend","category":"page"},{"location":"gradients/","page":"Differentiable programming","title":"Differentiable programming","text":"We can generate a batch of traces from the target foo2:","category":"page"},{"location":"gradients/","page":"Differentiable programming","title":"Differentiable programming","text":"ctx, trs, _, _ = importance_sampling(foo2, (), 10000)","category":"page"},{"location":"gradients/","page":"Differentiable programming","title":"Differentiable programming","text":"Jaynes supports Flux-style learning APIs:","category":"page"},{"location":"gradients/","page":"Differentiable programming","title":"Differentiable programming","text":"trained_ctx, losses = train!(ADAM(), foo1, (), trs)\nplt = plot(losses, legend=:false)\ndisplay(plt)","category":"page"},{"location":"gradients/","page":"Differentiable programming","title":"Differentiable programming","text":"(Image: LogPDF loss over training set.)","category":"page"},{"location":"gradients/","page":"Differentiable programming","title":"Differentiable programming","text":"warning: Warning\nDespite the fact that this seems like a batch training step with batch trs - the optimization is performed on a trace by trace basis, because traces can have different shapes. There are methodologies to allow for vectorized batching of traces (i.e. when the modeling language is restricted, so that the call graph of the program is constant over traces) but they are not yet enabled in the library.","category":"page"},{"location":"gradients/","page":"Differentiable programming","title":"Differentiable programming","text":"Here, after training, the resultant parameter values are stored in trained_ctx.metadata.trainable which is a map from Address to values. These values can be extracted and used in other contexts - the contextual execution of any program which includes addressed rand calls with literals will check the context for trainable metadata and return if the address matches a key.","category":"page"},{"location":"gradients/#Inference-compilation","page":"Differentiable programming","title":"Inference compilation","text":"","category":"section"},{"location":"gradients/","page":"Differentiable programming","title":"Differentiable programming","text":"One powerful inference feature allowed by the differentiable programming capabilities available in Julia is the creation of inference compilers automatically on a program by program basis. Inference compilers are neural network architectures which are trained to produce proposal distributions for sequential sampling-based inference engines.","category":"page"},{"location":"trace_types/","page":"-","title":"-","text":"One unique aspect enabled by the \"compiler plugin\" philosophy is the ability to utilize static analysis to identify when dependence and control flow information can be utilized to construct highly efficient trace types. This idea is found in a highly effective form in Gen. Because Gen currently operates at the syntactical level, Gen (mostly) requires that the user provide call context specific information about changing arguments, as well as dependence annotations (e.g. (static)) to generative functions. This helps Gen identify when things need to be updated, when things do not need to be updated, and what things can be cached. When calling incremental inference routines, these elements are incredibly important to maximize performance - if something hasn't changed, there's no need to waste computation on it.","category":"page"},{"location":"trace_types/","page":"-","title":"-","text":"Jaynes also provides a set of interfaces to enable the user to tell Jaynes how to do things more effectively. However, Jaynes also includes a set of automatic passes which can be used to recursively derive information about a call site without user-provided annotations. These passes work using a hybrid tracing approach provided by Mjolnir.jl and can be used without knowledge of runtime values (but do require type information to work effectively). If the analysis fails, the fallback is the normal, unoptimized HierarchicalTrace type. These passes are called automatically before any inference routine (but can be turned off if the user so desires). By default, Jaynes also produces logging @info statements during passes - so that the user can identify when a lowered method body breaks the assumptions required to construct the efficient GraphTrace through the analysis.","category":"page"},{"location":"trace_types/","page":"-","title":"-","text":"Here, we'll discuss the details (and limitations) of these passes. The fundamental analysis is a reaching analysis which determines where randomness flows in the IR representation of the program.","category":"page"},{"location":"#Introduction","page":"Introduction","title":"Introduction","text":"","category":"section"},{"location":"","page":"Introduction","title":"Introduction","text":"There are many active probabilistic programming frameworks in the Julia ecosystem (see Related Work) - the ecosystem is one of the richest sources of probabilistic programming research in any language. Frameworks tend to differentiate themselves based upon what model class they efficiently express (Stheno for example allows for convenient expression of Gaussian processes). Other frameworks support universal probabilistic programming with sample-based methods, and have optimized features which allow the efficient composition/expression of inference queries (e.g. Turing and Gen). Jaynes sits within this latter camp - it is strongly influenced by Turing and Gen, but more closely resembles a system like Zygote. The full-scope Jaynes system will allow you to express the same things you might express in these other systems - but the long term research goals may deviate slightly from these other libraries. In this section, I will discuss a few of the long term goals.","category":"page"},{"location":"","page":"Introduction","title":"Introduction","text":"warning: Warning\nIt's possible that this library will change in fundamental ways when new compiler interfaces become available in Julia 1.6 and beyond. The core implementation of this library will likely change as these interfaces become available (and the library should become more performant!) but the top level functionality should not change.","category":"page"},{"location":"#Graphical-model-DSL","page":"Introduction","title":"Graphical model DSL","text":"","category":"section"},{"location":"","page":"Introduction","title":"Introduction","text":"One of the research goals of Jaynes is to identify composable interfaces for allowing users to express static graphical models alongside dynamic sample-based models. This has previously been a difficult challenge - the representations which each class of probabilistic programming system utilizes is very different. Universal probabilistic programming systems have typically relied on sample-based inference, where the main representation is a structured form of an execution trace. In contrast, graphical model systems reason explicitly about distributions and thus require an explicit graph representation of how random variates depend on one another.","category":"page"},{"location":"","page":"Introduction","title":"Introduction","text":"A priori, there is no reason why these representations can't be combined in some way. The difficulty lies in deciding how to switch between representations when a program is amenable to both, as well as how the different representations will communicate across inference interfaces. For example, consider performing belief propagation on a model which supports both discrete distributions and function call sites for probabilistic programs which required a sample-based tracing mechanism for interpretation. To enable inference routines to operate on this \"call graph\" style representation, we have to construct and reason about the representation separately from the runtime of each program.","category":"page"},{"location":"#Automatic-inference-compilation","page":"Introduction","title":"Automatic inference compilation","text":"","category":"section"},{"location":"","page":"Introduction","title":"Introduction","text":"Jaynes already provides (rudimentary) support for gradient-based learning in probabilistic programs. Jaynes also provides a simple interface to construct and use inference compilers. The library function inference_compilation provides access to the inference compiler context. The result of inference compilation is a trained inference compiler context which can be used to generate traces for the posterior conditioned on observations.","category":"page"},{"location":"","page":"Introduction","title":"Introduction","text":"function foo1()\n    x = rand(:x, Normal, (3.0, 10.0))\n    y = rand(:y, Normal, (x + 15.0, 0.3))\n    return y\nend\n\nctx = inference_compilation(foo1, (), :y; batch_size = 256, epochs = 100)\nobs = constraints([(:y, 10.0)])\nctx, tr, score = trace(ctx, obs)","category":"page"},{"location":"","page":"Introduction","title":"Introduction","text":"The user must provide a target observation address to the inference_compilation call. This allows the inference compiler to construct an observation-specific head during training.","category":"page"},{"location":"","page":"Introduction","title":"Introduction","text":"This inference method is not yet fully tested - but you can take a peek in the src to see how it will eventually be stabilized. One of the long term goals of Jaynes is to provide a backend for inference compilation of arbitary programs. If a user does not specify the choice map structure of the program, the addresses will be automatically filled in, with enough reference metadata to allow the user to locate the rand call in the original program. Of course, it is always preferable to structure your own choice map space - this feature is intended to allow programs with untraced rand calls to utilize a useful (but possibly limited) form of inference.","category":"page"},{"location":"#Black-box-extensions","page":"Introduction","title":"Black-box extensions","text":"","category":"section"},{"location":"","page":"Introduction","title":"Introduction","text":"Jaynes is equipped with the ability to extend the tracing interface to black-box code. This is naturally facilitated by the metaprogramming capabilities of Cassette. The primary usage of this extension is to define new logpdf method definitions for code which may contain sources of randomness which are not annotated with addresses and/or where inspection by the tracing mechanism can be safely abstracted over. Thus, @primitive defines a contract between the user and the tracer - we assume that what you're doing is correct and we're not going to check you on it!","category":"page"},{"location":"","page":"Introduction","title":"Introduction","text":"The following example shows how this extension mechanism works.","category":"page"},{"location":"","page":"Introduction","title":"Introduction","text":"function foo(y::Float64)\n    # Untraced randomness.\n    y = rand(Normal(0.5, 3.0))\n    return y\nend\n\n@primitive function logpdf(fn::typeof(foo), args::Tuple{Float64}, y::Float64)\n    if y < 1.0\n        log(1) \n    else\n        -Inf\n    end\nend\n\nfunction bar(z::Float64)\n    y = rand(:y, foo, (z, ))\n    return y\nend\n\nctx = Generate(Trace())\nret = trace(ctx, bar, (0.3, ))\nprintln(ctx.metadata.tr)\n\n#  __________________________________\n#\n#               Playback\n#\n# y\n#          val  = 2.8607525733342767\n#\n#  __________________________________\n#\n# score : 0.0\n#\n#  __________________________________\n","category":"page"},{"location":"","page":"Introduction","title":"Introduction","text":"@primitive requires that the user define a logpdf definition for the call. This expands into overdub method definitions for the tracer which automatically work with all the core library context/metadata dispatch. The signature for logpdf should match the following type specification:","category":"page"},{"location":"","page":"Introduction","title":"Introduction","text":"logpdf(::typeof(your_func), ::Tuple, ::T)","category":"page"},{"location":"","page":"Introduction","title":"Introduction","text":"where T is the return type of your_func. ","category":"page"},{"location":"","page":"Introduction","title":"Introduction","text":"Note that, if your defined logpdf is differentiable - gradients will automatically be derived for use in Gradient learning contexts as long as Zygote can differentiate through it. This can be used to e.g. train neural networks in Gradient contexts where the loss is wrapped in the logpdf/@primitive interface mechanism.","category":"page"},{"location":"","page":"Introduction","title":"Introduction","text":"The extension mechanism does not check if the user-defined logpdf is valid. This mechanism also overrides the normal fallback (i.e. tracing into calls) for any function for which the mechanism is used to write a logpdf - this means that if you write a logpdf using this mechanism for a call and there is addressed randomness in the call, it will be ignored by the tracer.","category":"page"},{"location":"#Summary","page":"Introduction","title":"Summary","text":"","category":"section"},{"location":"","page":"Introduction","title":"Introduction","text":"To facilitate these research goals, Jaynes is designed as a type of compiler plugin. In contrast to existing frameworks, Jaynes does not require the use of specialized macros to denote where the modeling language begins and ends. The use of macros to denote a language barrier has a number of positive advantages from a user-facing perspective, but some disadvantages related to composability. As an opinion, I believe that a general framework for expressing probabilistic programs should mimic the philosophy of differentiable programming. The compiler plugin backend should prevent users from writing programs which are \"not valid\" (either as a static analysis or a runtime error) but should otherwise get out of the way of the user. Any macros present in the Jaynes library extend the core functionality or provide convenient access to code generation for use by a user - but are not required for modeling and inference.","category":"page"},{"location":"","page":"Introduction","title":"Introduction","text":"Because Jaynes is a compiler plugin, it is highly configurable. The goal of the core package is to implement a set of \"sensible defaults\" for common use, while allowing the implementation of other DSLs, custom inference algorithms, custom representations, etc on top. In this philosophy, Jaynes follows a path first laid out by Gen and Zygote...with a few twists.","category":"page"},{"location":"","page":"Introduction","title":"Introduction","text":"Bon appétit!","category":"page"}]
}
