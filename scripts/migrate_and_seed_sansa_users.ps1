$ErrorActionPreference = "Stop"

$apiKey = "AIzaSyCYVJMnLuYM3JDOcBlIhyKI_0FP_ea_Tac"
$projectId = "prj-aurorealty-ehs-ptw-dev"
$baseFsUrl = "https://firestore.googleapis.com/v1/projects/$projectId/databases/(default)/documents"
$authUrl = "https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=$apiKey"
$signUpUrl = "https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=$apiKey"

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "STEP 1: Authenticate Super Admin (aic1176@aurogroup.com)" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan

$authBody = @{
    email = "aic1176@aurogroup.com"
    password = "Auro@12345"
    returnSecureToken = $true
} | ConvertTo-Json

$authRes = Invoke-RestMethod -Uri $authUrl -Method Post -Body $authBody -ContentType "application/json"
$idToken = $authRes.idToken
$superAdminUid = $authRes.localId
Write-Host "Super Admin logged in. UID: $superAdminUid" -ForegroundColor Green

$headers = @{
    Authorization = "Bearer $idToken"
    "Content-Type" = "application/json"
}

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "STEP 2: Ensure Super Admin document in Firestore /users" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan

$superDocFields = @{
    fields = @{
        uid = @{ stringValue = $superAdminUid }
        id = @{ stringValue = $superAdminUid }
        email = @{ stringValue = "aic1176@aurogroup.com" }
        name = @{ stringValue = "ARPL Super Administrator (AIC1176)" }
        displayName = @{ stringValue = "ARPL Super Administrator (AIC1176)" }
        role = @{ stringValue = "super-admin" }
        uiRole = @{ stringValue = "super-admin" }
        ptwRole = @{ stringValue = "super-admin" }
        roleLabel = @{ stringValue = "Enterprise Super Admin" }
        projectName = @{ stringValue = "Global Enterprise Scope (All Sites)" }
        campusWide = @{ booleanValue = $true }
        superAdmin = @{ booleanValue = $true }
        status = @{ stringValue = "Active" }
    }
} | ConvertTo-Json -Depth 10

$saUrl = "$baseFsUrl/users/$superAdminUid"
Invoke-RestMethod -Uri $saUrl -Method Patch -Body $superDocFields -Headers $headers | Out-Null
Write-Host "Super Admin Firestore document established at /users/$superAdminUid" -ForegroundColor Green

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "STEP 3: Delete all old existing users from Firestore" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan

# Clean /users (except super admin)
try {
    $uRes = Invoke-RestMethod -Uri "$baseFsUrl/users" -Method Get -Headers $headers
    if ($uRes.documents) {
        foreach ($d in $uRes.documents) {
            $docName = $d.name
            $docId = $docName.Substring($docName.LastIndexOf('/') + 1)
            if ($docId -ne $superAdminUid) {
                Write-Host "Deleting old user: $docId" -ForegroundColor Yellow
                Invoke-RestMethod -Uri "https://firestore.googleapis.com/v1/$docName" -Method Delete -Headers $headers | Out-Null
            }
        }
    }
} catch {
    Write-Host "Notice on cleaning /users: $_" -ForegroundColor DarkGray
}

# Clean /project_admins
try {
    $paRes = Invoke-RestMethod -Uri "$baseFsUrl/project_admins" -Method Get -Headers $headers
    if ($paRes.documents) {
        foreach ($d in $paRes.documents) {
            $docName = $d.name
            Write-Host "Deleting old project_admin: $docName" -ForegroundColor Yellow
            Invoke-RestMethod -Uri "https://firestore.googleapis.com/v1/$docName" -Method Delete -Headers $headers | Out-Null
        }
    }
} catch {
    Write-Host "Notice on cleaning /project_admins: $_" -ForegroundColor DarkGray
}

# Clean /site_personnel
try {
    $spRes = Invoke-RestMethod -Uri "$baseFsUrl/site_personnel" -Method Get -Headers $headers
    if ($spRes.documents) {
        foreach ($d in $spRes.documents) {
            $docName = $d.name
            Write-Host "Deleting old site_personnel: $docName" -ForegroundColor Yellow
            Invoke-RestMethod -Uri "https://firestore.googleapis.com/v1/$docName" -Method Delete -Headers $headers | Out-Null
        }
    }
} catch {
    Write-Host "Notice on cleaning /site_personnel: $_" -ForegroundColor DarkGray
}

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "STEP 4: Insert Sansa County Sector 1 Users (42 accounts)" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan

$jsonPath = Join-Path $PSScriptRoot "sansa_sector1_users.json"
$usersData = Get-Content $jsonPath -Raw | ConvertFrom-Json

$count = 0
$createdAuthList = @()

foreach ($u in $usersData) {
    $count++
    $email = $u.email
    $pwd = "Auro@12345"
    $userUid = $null

    # Create in Firebase Authentication
    $signUpBody = @{
        email = $email
        password = $pwd
        returnSecureToken = $true
    } | ConvertTo-Json

    try {
        $regRes = Invoke-RestMethod -Uri $signUpUrl -Method Post -Body $signUpBody -ContentType "application/json"
        $userUid = $regRes.localId
    } catch {
        # Already exists, fetch UID by sign in
        try {
            $siBody = @{
                email = $email
                password = $pwd
                returnSecureToken = $true
            } | ConvertTo-Json
            $siRes = Invoke-RestMethod -Uri $authUrl -Method Post -Body $siBody -ContentType "application/json"
            $userUid = $siRes.localId
        } catch {
            $userUid = "stf-sansa-" + $u.sl.ToString("D3")
        }
    }

    $isCampus = [bool]$u.campusWide
    $uiRole = if ($u.role -eq "project-admin") { "admin" } else { $u.role }
    $phoneVal = if ($u.phone) { [string]$u.phone } else { "" }

    # Construct Firestore fields
    $fields = @{
        fields = @{
            uid = @{ stringValue = $userUid }
            id = @{ stringValue = $userUid }
            name = @{ stringValue = $u.name }
            displayName = @{ stringValue = $u.name }
            email = @{ stringValue = $email }
            employeeId = @{ stringValue = $u.employeeId }
            empId = @{ stringValue = $u.employeeId }
            role = @{ stringValue = $u.role }
            uiRole = @{ stringValue = $uiRole }
            ptwRole = @{ stringValue = $u.role }
            roleLabel = @{ stringValue = $u.roleLabel }
            projectId = @{ stringValue = "PRJ-SANSA" }
            projectName = @{ stringValue = "Sansa County" }
            assignedTower = @{ stringValue = $u.assignedTower }
            location = @{ stringValue = $u.assignedTower }
            campusWide = @{ booleanValue = $isCampus }
            phone = @{ stringValue = $phoneVal }
            status = @{ stringValue = "Active" }
            createdBy = @{ stringValue = "aic1176@aurogroup.com" }
            isRealFirestoreUser = @{ booleanValue = $true }
        }
    }

    if (-not $isCampus) {
        $fields.fields["locationName"] = @{ stringValue = $u.assignedTower }
    } else {
        $fields.fields["locationName"] = @{ nullValue = $null }
    }

    $jsonBody = $fields | ConvertTo-Json -Depth 10

    # Write to /users/{userUid}
    Invoke-RestMethod -Uri "$baseFsUrl/users/$userUid" -Method Patch -Body $jsonBody -Headers $headers | Out-Null

    # Write to /site_personnel/{userUid}
    Invoke-RestMethod -Uri "$baseFsUrl/site_personnel/$userUid" -Method Patch -Body $jsonBody -Headers $headers | Out-Null

    # If Site Safety Incharge / Site Admin, write to /project_admins and update projects/PRJ-SANSA
    if ($u.role -eq "project-admin" -or $u.name -match "Gnanaprakasam") {
        Invoke-RestMethod -Uri "$baseFsUrl/project_admins/$userUid" -Method Patch -Body $jsonBody -Headers $headers | Out-Null
        
        $prjPatch = @{
            fields = @{
                adminUid = @{ stringValue = $userUid }
                adminName = @{ stringValue = $u.name }
                adminEmail = @{ stringValue = $email }
                safetyInchargeName = @{ stringValue = $u.name }
                safetyInchargeEmail = @{ stringValue = $email }
                employeeId = @{ stringValue = $u.employeeId }
            }
        } | ConvertTo-Json -Depth 10

        # Update projects/PRJ-SANSA with mask
        $prjUrl = "$baseFsUrl/projects/PRJ-SANSA?updateMask.fieldPaths=adminUid&updateMask.fieldPaths=adminName&updateMask.fieldPaths=adminEmail&updateMask.fieldPaths=safetyInchargeName&updateMask.fieldPaths=safetyInchargeEmail&updateMask.fieldPaths=employeeId"
        Invoke-RestMethod -Uri $prjUrl -Method Patch -Body $prjPatch -Headers $headers | Out-Null
        Write-Host "   -> Assigned $email as Site Admin & Safety Incharge for PRJ-SANSA" -ForegroundColor Cyan
    }

    Write-Host "[$count/42] Provisioned: $($u.name) ($($u.roleLabel)) - $email [UID: $userUid]" -ForegroundColor Green
}

Write-Host "============================================================" -ForegroundColor Green
Write-Host "SUCCESS: All 42 Sansa County Sector 1 users inserted into Firestore!" -ForegroundColor Green
Write-Host "============================================================" -ForegroundColor Green
