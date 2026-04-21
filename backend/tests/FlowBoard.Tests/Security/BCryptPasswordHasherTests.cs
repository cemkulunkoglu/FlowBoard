using FlowBoard.Infrastructure.Security;

namespace FlowBoard.Tests.Security;

public class BCryptPasswordHasherTests
{
    private readonly BCryptPasswordHasher _hasher = new();

    [Fact]
    public void Verify_ReturnsTrue_ForCorrectPassword()
    {
        var hash = _hasher.Hash("correct-password");

        Assert.True(_hasher.Verify("correct-password", hash));
    }

    [Fact]
    public void Verify_ReturnsFalse_ForWrongPassword()
    {
        var hash = _hasher.Hash("correct-password");

        Assert.False(_hasher.Verify("wrong-password", hash));
    }

    [Fact]
    public void Hash_ProducesDifferentOutputs_ForSamePassword()
    {
        var h1 = _hasher.Hash("same");
        var h2 = _hasher.Hash("same");

        Assert.NotEqual(h1, h2);
        Assert.True(_hasher.Verify("same", h1));
        Assert.True(_hasher.Verify("same", h2));
    }
}
