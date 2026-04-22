// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title  CertificateValidation
 * @notice Issues and verifies academic certificates on Sepolia testnet.
 *         Off-chain metadata (student name, template image, etc.) is stored
 *         in MySQL; only the certificate hash is recorded on-chain.
 * @dev    Only the contract owner (deployer) can grant/revoke admin roles.
 *         Admins may issue and revoke certificates.
 */
contract CertificateValidation {

    // ── State ────────────────────────────────────────────────────────────────

    address public owner;
    mapping(address => bool) public authorizedAdmins;

    struct Certificate {
        string  certificateId;   // human-readable ID, e.g. "CV-ABC12345"
        string  studentId;
        string  studentName;
        string  course;
        string  year;
        address issuerId;        // admin wallet that issued this cert
        string  issuerName;
        uint256 issueDate;       // block.timestamp at issuance
        bool    isValid;         // false once revoked
    }

    /// @dev certHash (bytes32) → Certificate
    mapping(bytes32 => Certificate) private _certificates;

    // ── Events ───────────────────────────────────────────────────────────────

    event CertificateIssued(
        bytes32 indexed certHash,
        string          certificateId,
        string          studentId,
        address indexed issuerId
    );
    event CertificateRevoked(bytes32 indexed certHash, address indexed revokedBy);
    event AdminAdded(address indexed admin);
    event AdminRemoved(address indexed admin);

    // ── Modifiers ────────────────────────────────────────────────────────────

    modifier onlyOwner() {
        require(msg.sender == owner, "CV: not owner");
        _;
    }

    modifier onlyAdmin() {
        require(
            authorizedAdmins[msg.sender] || msg.sender == owner,
            "CV: not authorized admin"
        );
        _;
    }

    // ── Constructor ──────────────────────────────────────────────────────────

    constructor() {
        owner = msg.sender;
        authorizedAdmins[msg.sender] = true;
        emit AdminAdded(msg.sender);
    }

    // ── Admin management ─────────────────────────────────────────────────────

    function addAdmin(address admin) external onlyOwner {
        authorizedAdmins[admin] = true;
        emit AdminAdded(admin);
    }

    function removeAdmin(address admin) external onlyOwner {
        require(admin != owner, "CV: cannot remove owner");
        authorizedAdmins[admin] = false;
        emit AdminRemoved(admin);
    }

    // ── Certificate operations ───────────────────────────────────────────────

    /**
     * @notice Record a new certificate on-chain.
     * @param certHash      SHA-256 of certificate data, padded to bytes32.
     * @param certificateId Short unique ID stored in MySQL (e.g. "CV-ABC12345").
     * @param studentId     Student identifier (e.g. "ST-2024-001").
     * @param studentName   Full student name.
     * @param course        Course / programme name.
     * @param year          Graduation or issue year.
     * @param issuerName    Name of the issuing institution.
     */
    function issueCertificate(
        bytes32 certHash,
        string calldata certificateId,
        string calldata studentId,
        string calldata studentName,
        string calldata course,
        string calldata year,
        string calldata issuerName
    ) external onlyAdmin {
        require(_certificates[certHash].issueDate == 0, "CV: hash already recorded");

        _certificates[certHash] = Certificate({
            certificateId : certificateId,
            studentId     : studentId,
            studentName   : studentName,
            course        : course,
            year          : year,
            issuerId      : msg.sender,
            issuerName    : issuerName,
            issueDate     : block.timestamp,
            isValid       : true
        });

        emit CertificateIssued(certHash, certificateId, studentId, msg.sender);
    }

    /**
     * @notice Verify a certificate by its hash.
     * @param certHash bytes32 hash to look up.
     * @return exists        True if the hash is recorded on-chain.
     * @return isValid       True if the certificate has NOT been revoked.
     * @return certificateId Human-readable ID.
     * @return studentName   Student full name.
     * @return course        Course name.
     * @return year          Issue year.
     * @return issuerName    Issuing institution.
     * @return issueDate     Unix timestamp of issuance (block time).
     */
    function verifyCertificate(bytes32 certHash)
        external
        view
        returns (
            bool    exists,
            bool    isValid,
            string  memory certificateId,
            string  memory studentName,
            string  memory course,
            string  memory year,
            string  memory issuerName,
            uint256 issueDate
        )
    {
        Certificate storage c = _certificates[certHash];
        if (c.issueDate == 0) {
            return (false, false, "", "", "", "", "", 0);
        }
        return (
            true,
            c.isValid,
            c.certificateId,
            c.studentName,
            c.course,
            c.year,
            c.issuerName,
            c.issueDate
        );
    }

    /**
     * @notice Revoke a certificate (marks isValid = false on-chain).
     */
    function revokeCertificate(bytes32 certHash) external onlyAdmin {
        require(_certificates[certHash].issueDate != 0, "CV: certificate not found");
        require(_certificates[certHash].isValid,         "CV: already revoked");
        _certificates[certHash].isValid = false;
        emit CertificateRevoked(certHash, msg.sender);
    }
}
