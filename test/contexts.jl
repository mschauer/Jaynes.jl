function LinearGaussian(μ::Float64, σ::Float64)
    α = 5.0
    x = rand(:x, Normal(μ, σ))
    y = rand(:y, Normal(α * x, 1.0))
    return y
end

function LinearGaussianProposal()
    α = 10.0
    x = rand(:x, Normal(α * 3.0, 3.0))
end

@testset "Simulate" begin
    ret, cl = simulate(LinearGaussian, 0.5, 3.0)
    @test haskey(cl, :x)
    @test haskey(cl, :y)
end

@testset "Generate" begin
    sel = selection([(:x, ) => 5.0])
    ret, cl, w = generate(sel, LinearGaussian, 0.5, 3.0)
    @test get_ret(cl[:x]) == 5.0
    sel = selection([(:x,) => 5.0, (:y,) => 10.0])
    ret, cl, w = generate(sel, LinearGaussian, 0.5, 3.0)
    @test get_ret(cl[:x]) == 5.0
    @test get_ret(cl[:y]) == 10.0
end

@testset "Update" begin
    ret, cl = simulate(LinearGaussian, 0.5, 3.0)
    stored_at_x = get_ret(cl[:x])
    stored_at_y = get_ret(cl[:y])
    sel = selection([(:x,) => 5.0])
    ret, cl, w, retdiff, d = update(sel, cl)
    # Discard should be original :x
    @test get_ret(d[:x]) == stored_at_x
    # New should be equal to constraint.
    @test get_ret(cl[:x]) == 5.0
    sel = selection([(:y,) => 10.0])
    ret, cl, w, retdiff, d = update(sel, cl)
    @test get_ret(d[:y]) == stored_at_y
    @test get_ret(cl[:x]) == 5.0
    @test get_ret(cl[:y]) == 10.0
end

@testset "Regenerate" begin
    ret, cl = simulate(LinearGaussian, 0.5, 3.0)
    stored_at_x = get_ret(cl[:x])
    stored_at_y = get_ret(cl[:y])
    sel = selection([(:x, )])
    ret, cl, w, retdiff, d = regenerate(sel, cl)
    # Discard should be original :x
    @test get_ret(d[:x]) == stored_at_x
    # New should not be equal to original.
    @test get_ret(cl[:x]) != stored_at_x
    sel = selection([(:y, )])
    ret, cl, w, retdiff, d = regenerate(sel, cl)
    @test get_ret(d[:y]) == stored_at_y
end

@testset "Propose" begin
    ret, cl, w = propose(LinearGaussian, 0.5, 3.0)
    # Propose should track score.
    @test get_score(cl) != 0.0
end

@testset "Score" begin
    sel = selection([(:x, ) => 5.0, (:y, ) => 10.0])
    ret, sc = score(sel, LinearGaussian, 0.5, 3.0)
    @test sc != 0.0
end
