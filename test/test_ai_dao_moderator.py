"""
Tests for AIDAOModerator intelligent contract.

Run against GenLayer Studio (studionet or localnet):
    gltest test/test_ai_dao_moderator.py

For faster "direct mode" execution (leader only, no validator consensus):
    gltest test/test_ai_dao_moderator.py --direct

The AI calls in submit_proposal and vote hit the configured LLM.
When using GenLayer Studio's built-in mock AI, the LLM will return
deterministic responses based on the prompt content, making these
tests reproducible without live model access.

Mock LLM expected behaviour for these tests:
  - Constitution clearly states "build public goods and fund open-source"
  - Valid proposals about open-source grants → approved=True, score >= 60
  - Spam proposals ("buy my NFT") → approved=False
  - Strong arguments → weight >= 6
  - Empty/spam arguments → weight <= 3
"""

from gltest import get_contract_factory, default_account, create_account
from gltest.helpers import load_fixture
from gltest.assertions import tx_execution_succeeded, tx_execution_failed

# ---------------------------------------------------------------------------
# Shared test constitution
# ---------------------------------------------------------------------------

CONSTITUTION = (
    "This DAO exists to fund open-source software projects that create "
    "public goods. All funded projects must be MIT or Apache-2.0 licensed, "
    "have a public repository, and benefit a broad community. "
    "Proposals requesting funds for proprietary software, personal benefit, "
    "or unrelated activities will be rejected."
)

# ---------------------------------------------------------------------------
# Fixture: deploy a fresh contract for each test suite
# ---------------------------------------------------------------------------


def deploy_contract():
    factory = get_contract_factory("AIDAOModerator")
    contract = factory.deploy(args=[CONSTITUTION])

    # Sanity check: no proposals yet
    result = contract.get_result.__func__(contract, args=["nonexistent"])  # noqa
    # Expected: raises, so we just confirm deploy worked by calling a view
    # (get_result raises for unknown pid, so we skip that check here)
    return contract


# ---------------------------------------------------------------------------
# Helper: submit a proposal in "leader_only" (direct) mode
# leader_only=True skips validator consensus — fastest path for unit tests.
# ---------------------------------------------------------------------------


def submit_proposal(contract, pid: str, title: str, body: str):
    return contract.submit_proposal(
        args=[pid, title, body],
        leader_only=True,
        wait_interval=10_000,
        wait_retries=20,
    )


def cast_vote(contract, pid: str, voter: str, support: bool, argument: str):
    return contract.vote(
        args=[pid, voter, support, argument],
        leader_only=True,
        wait_interval=10_000,
        wait_retries=20,
    )


# ---------------------------------------------------------------------------
# Tests: proposal submission
# ---------------------------------------------------------------------------


def test_submit_valid_proposal():
    """A legitimate open-source grant proposal should be approved."""
    contract = load_fixture(deploy_contract)

    result = submit_proposal(
        contract,
        pid="grant-001",
        title="Fund rust-lang documentation improvements",
        body=(
            "We propose allocating 5,000 USDC to improve the official Rust "
            "programming language documentation. The work will be open-source "
            "(MIT license), tracked in a public GitHub repo, and will benefit "
            "hundreds of thousands of developers worldwide."
        ),
    )
    assert tx_execution_succeeded(result)

    proposal = contract.get_proposal(args=["grant-001"])
    assert proposal["pid"] == "grant-001"
    assert proposal["approved"] is True
    assert proposal["score"] >= 60
    assert isinstance(proposal["reason"], str)
    assert len(proposal["reason"]) > 0


def test_submit_spam_proposal_is_rejected():
    """Spam / off-mission proposals should be rejected by the AI moderator."""
    contract = load_fixture(deploy_contract)

    result = submit_proposal(
        contract,
        pid="spam-001",
        title="Buy my NFT collection",
        body="My NFT collection is amazing. Send ETH to my wallet for exclusive access.",
    )
    assert tx_execution_succeeded(result)  # TX succeeds, but AI verdict is rejected

    proposal = contract.get_proposal(args=["spam-001"])
    assert proposal["approved"] is False
    assert proposal["score"] < 60


def test_duplicate_proposal_raises():
    """Submitting the same pid twice should raise an exception."""
    contract = load_fixture(deploy_contract)

    submit_proposal(
        contract,
        pid="dup-001",
        title="Fund open-source tooling",
        body="Build an Apache-2.0 licensed developer toolkit for the community.",
    )

    duplicate = submit_proposal(
        contract,
        pid="dup-001",
        title="Fund open-source tooling",
        body="Build an Apache-2.0 licensed developer toolkit for the community.",
    )
    assert tx_execution_failed(duplicate)


# ---------------------------------------------------------------------------
# Tests: voting
# ---------------------------------------------------------------------------


def test_vote_on_approved_proposal():
    """Votes on approved proposals should succeed and affect weighted tallies."""
    contract = load_fixture(deploy_contract)

    submit_proposal(
        contract,
        pid="vote-test-001",
        title="Fund open-source security auditing tool",
        body=(
            "Develop a free, MIT-licensed static analysis tool for Solidity "
            "smart contracts. Public repo, no proprietary components. "
            "Directly benefits the open-source blockchain community."
        ),
    )

    # Confirm proposal was approved before voting
    proposal = contract.get_proposal(args=["vote-test-001"])
    assert proposal["approved"] is True, "Pre-condition: proposal must be approved"

    voter_a = default_account.address
    voter_b = create_account().address

    # Strong yes-argument
    yes_result = cast_vote(
        contract,
        pid="vote-test-001",
        voter=voter_a,
        support=True,
        argument=(
            "This directly satisfies the DAO constitution's mandate to fund "
            "open-source public goods. Security tooling lowers the barrier for "
            "developers and protects the broader ecosystem. MIT license ensures "
            "community-wide access. I strongly support funding this."
        ),
    )
    assert tx_execution_succeeded(yes_result)

    # Weak no-argument
    no_result = cast_vote(
        contract,
        pid="vote-test-001",
        voter=voter_b,
        support=False,
        argument="I don't like it.",
    )
    assert tx_execution_succeeded(no_result)

    result = contract.get_result(args=["vote-test-001"])
    assert result["pid"] == "vote-test-001"
    assert result["total_votes"] == 2
    # Strong yes-argument should outweigh weak no-argument
    assert result["yes_weight"] > result["no_weight"]
    assert result["passed"] is True


def test_vote_rejected_proposal_raises():
    """Voting on a rejected proposal should fail."""
    contract = load_fixture(deploy_contract)

    submit_proposal(
        contract,
        pid="rejected-001",
        title="Buy my NFT",
        body="Send ETH to my wallet for exclusive access to my NFT collection.",
    )

    proposal = contract.get_proposal(args=["rejected-001"])
    assert proposal["approved"] is False, "Pre-condition: proposal must be rejected"

    vote_result = cast_vote(
        contract,
        pid="rejected-001",
        voter=default_account.address,
        support=True,
        argument="I think this is great!",
    )
    assert tx_execution_failed(vote_result)


def test_vote_unknown_proposal_raises():
    """Voting on a nonexistent proposal should fail."""
    contract = load_fixture(deploy_contract)

    vote_result = cast_vote(
        contract,
        pid="does-not-exist",
        voter=default_account.address,
        support=True,
        argument="Test argument",
    )
    assert tx_execution_failed(vote_result)


# ---------------------------------------------------------------------------
# Tests: get_result and get_proposal
# ---------------------------------------------------------------------------


def test_get_result_no_votes():
    """An approved proposal with no votes should show zero weights and not passed."""
    contract = load_fixture(deploy_contract)

    submit_proposal(
        contract,
        pid="empty-votes-001",
        title="Open-source data pipeline for scientific research",
        body=(
            "Build an Apache-2.0 licensed ETL pipeline for processing publicly "
            "available scientific datasets. Public GitHub repo, community-driven."
        ),
    )

    proposal = contract.get_proposal(args=["empty-votes-001"])
    assert proposal["approved"] is True

    result = contract.get_result(args=["empty-votes-001"])
    assert result["yes_weight"] == 0
    assert result["no_weight"] == 0
    assert result["total_votes"] == 0
    assert result["passed"] is False  # 0 > 0 is False


def test_get_result_unknown_pid_raises():
    """get_result on unknown pid should raise."""
    contract = load_fixture(deploy_contract)

    try:
        contract.get_result(args=["nonexistent-pid"])
        assert False, "Expected exception was not raised"
    except Exception:
        pass  # expected


def test_get_proposal_unknown_pid_raises():
    """get_proposal on unknown pid should raise."""
    contract = load_fixture(deploy_contract)

    try:
        contract.get_proposal(args=["nonexistent-pid"])
        assert False, "Expected exception was not raised"
    except Exception:
        pass  # expected


# ---------------------------------------------------------------------------
# Tests: argument weight affects outcome
# ---------------------------------------------------------------------------


def test_argument_quality_determines_outcome():
    """
    Two voters: one with a high-quality argument, one with a low-quality argument,
    on opposite sides. The high-quality argument should determine the outcome.
    """
    contract = load_fixture(deploy_contract)

    submit_proposal(
        contract,
        pid="quality-test-001",
        title="Fund open-source educational resources for blockchain development",
        body=(
            "Create a comprehensive MIT-licensed curriculum and code examples "
            "for learning blockchain development. Hosted on GitHub, freely "
            "accessible to all. Aligns with the DAO mission to build public goods."
        ),
    )

    proposal = contract.get_proposal(args=["quality-test-001"])
    assert proposal["approved"] is True

    # High-quality NO argument
    cast_vote(
        contract,
        pid="quality-test-001",
        voter=create_account().address,
        support=False,
        argument=(
            "While educational resources are valuable, the DAO constitution "
            "specifically prioritizes software projects over curricula. "
            "Educational content does not constitute 'open-source software' "
            "under our funding guidelines. The budget would better serve a "
            "direct tooling or infrastructure project aligned with the MIT/Apache "
            "license requirement for runnable code."
        ),
    )

    # Low-quality YES argument
    cast_vote(
        contract,
        pid="quality-test-001",
        voter=create_account().address,
        support=True,
        argument="yes",
    )

    result = contract.get_result(args=["quality-test-001"])
    assert result["total_votes"] == 2
    # High-quality NO should outweigh low-quality YES
    assert result["no_weight"] > result["yes_weight"]
    assert result["passed"] is False
