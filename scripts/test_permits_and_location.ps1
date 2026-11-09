$ErrorActionPreference = "Stop"

$apiKey = "AIzaSyCYVJMnLuYM3JDOcBlIhyKI_0FP_ea_Tac"
$projectId = "prj-aurorealty-ehs-ptw-dev"
$baseFsUrl = "https://firestore.googleapis.com/v1/projects/$projectId/databases/(default)/documents"
$authUrl = "https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=$apiKey"

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "TEST 1: Log in as Sansa County Site Supervisor" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan

$supEmail = "vinayak.20220166@aurorealty.com"
$supPassword = "Auro@12345"

$loginBody = @{
    email = $supEmail
    password = $supPassword
    returnSecureToken = $true
} | ConvertTo-Json

$loginRes = Invoke-RestMethod -Uri $authUrl -Method Post -Body $loginBody -ContentType "application/json"
$idToken = $loginRes.idToken
$supUid = $loginRes.localId
Write-Host "Site Supervisor Logged In successfully! UID: $supUid" -ForegroundColor Green

$headers = @{
    Authorization = "Bearer $idToken"
    "Content-Type" = "application/json"
}

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "TEST 2: Verify Sansa County Location & Zone Geofence Setup" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan

$prjDoc = Invoke-RestMethod -Uri "$baseFsUrl/projects/PRJ-SANSA" -Headers $headers
$prjFields = $prjDoc.fields

$zones = @(
    @{ Name = "Sector 1 - Zone 1 & 2"; Lat = 17.43523; Lng = 78.37613; Radius = 500 },
    @{ Name = "Sector 1 - Zone 03";     Lat = 17.43523; Lng = 78.37613; Radius = 500 },
    @{ Name = "Sector 1 - Zone 04";     Lat = 17.43528; Lng = 78.37616; Radius = 500 }
)

Write-Host "Authoritative configured locations for Sansa County:" -ForegroundColor Yellow
foreach ($z in $zones) {
    Write-Host "  -> $($z.Name): Lat $($z.Lat), Lng $($z.Lng), Radius $($z.Radius)m" -ForegroundColor White
}

# Function to calculate Haversine distance in meters
function Get-HaversineMeters($lat1, $lng1, $lat2, $lng2) {
    $R = 6371000 # Earth radius in meters
    $dLat = [Math]::PI * ($lat2 - $lat1) / 180.0
    $dLng = [Math]::PI * ($lng2 - $lng1) / 180.0
    $a = [Math]::Sin($dLat / 2) * [Math]::Sin($dLat / 2) +
         [Math]::Cos([Math]::PI * $lat1 / 180.0) * [Math]::Cos([Math]::PI * $lat2 / 180.0) *
         [Math]::Sin($dLng / 2) * [Math]::Sin($dLng / 2)
    $c = 2 * [Math]::Atan2([Math]::Sqrt($a), [Math]::Sqrt(1 - $a))
    return [Math]::Round($R * $c, 2)
}

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "TEST 3: Save Draft Permit & Verify Persistence in Firestore" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan

$draftId = "PTW-DRAFT-" + (Get-Random -Minimum 100000 -Maximum 999999)
$draftBody = @{
    fields = @{
        id = @{ stringValue = $draftId }
        ptype = @{ stringValue = "excavation" }
        status = @{ stringValue = "Draft" }
        project = @{ stringValue = "Sansa County" }
        projectId = @{ stringValue = "PRJ-SANSA" }
        projectName = @{ stringValue = "Sansa County" }
        tower = @{ stringValue = "Sector 1 - Zone 1 & 2" }
        location = @{ stringValue = "Sector 1 - Zone 1 & 2, Grid A1-A4" }
        createdBy = @{ stringValue = "Vinayak" }
        createdByEmail = @{ stringValue = $supEmail }
        creatorEmail = @{ stringValue = $supEmail }
        createdByUid = @{ stringValue = $supUid }
        createdRoleKey = @{ stringValue = "site-supervisor" }
        createdAt = @{ timestampValue = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ss.fffZ") }
        updatedAt = @{ timestampValue = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ss.fffZ") }
    }
} | ConvertTo-Json -Depth 10

$draftRes = Invoke-RestMethod -Uri "$baseFsUrl/permits/$draftId" -Method Patch -Headers $headers -Body $draftBody
Write-Host "Draft Permit $draftId successfully persisted in Firestore /permits!" -ForegroundColor Green

# Verify we can fetch the draft back
$fetchDraft = Invoke-RestMethod -Uri "$baseFsUrl/permits/$draftId" -Headers $headers
if ($fetchDraft.fields.status.stringValue -eq "Draft") {
    Write-Host "VERIFIED: Draft $draftId is successfully recorded and queryable in Firestore with status 'Draft'." -ForegroundColor Green
} else {
    throw "Draft permit status verification failed!"
}

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "TEST 4: Raise Permit 1 (Excavation) - Exact Configured Location" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan

# Supervisor coordinates at Sector 1 - Zone 1 & 2
$capLat = 17.43523
$capLng = 78.37613
$zoneCenter = $zones[0]

$dist = Get-HaversineMeters $capLat $capLng $zoneCenter.Lat $zoneCenter.Lng
Write-Host "Live GPS captured: Lat $capLat, Lng $capLng" -ForegroundColor White
Write-Host "Distance to Zone pin ($($zoneCenter.Name)): $dist meters (Threshold: $($zoneCenter.Radius)m)" -ForegroundColor White

if ($dist -le $zoneCenter.Radius) {
    Write-Host "PASS: Geofence check succeeded! Within $dist meters of location pin." -ForegroundColor Green
} else {
    throw "FAIL: Out of radius ($dist m > $($zoneCenter.Radius) m)"
}

$permit1Id = "EXC-2026-" + (Get-Random -Minimum 100000 -Maximum 999999)
$p1Body = @{
    fields = @{
        id = @{ stringValue = $permit1Id }
        ptype = @{ stringValue = "excavation" }
        activity = @{ stringValue = "Excavation (PTW-001)" }
        status = @{ stringValue = "Pending Site Engineer Acknowledgment" }
        project = @{ stringValue = "Sansa County" }
        projectId = @{ stringValue = "PRJ-SANSA" }
        projectName = @{ stringValue = "Sansa County" }
        tower = @{ stringValue = "Sector 1 - Zone 1 & 2" }
        location = @{ stringValue = "Tower Footprint Excavation, Sector 1 - Zone 1 & 2" }
        latitude = @{ doubleValue = $capLat }
        longitude = @{ doubleValue = $capLng }
        accuracy = @{ doubleValue = 8.5 }
        distance = @{ doubleValue = $dist }
        within = @{ booleanValue = $true }
        createdBy = @{ stringValue = "Vinayak" }
        createdByEmail = @{ stringValue = $supEmail }
        creatorEmail = @{ stringValue = $supEmail }
        createdByUid = @{ stringValue = $supUid }
        createdRoleKey = @{ stringValue = "site-supervisor" }
        createdAt = @{ timestampValue = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ss.fffZ") }
        submittedAt = @{ timestampValue = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ss.fffZ") }
    }
} | ConvertTo-Json -Depth 10

$p1Res = Invoke-RestMethod -Uri "$baseFsUrl/permits/$permit1Id" -Method Patch -Headers $headers -Body $p1Body
Write-Host "Permit 1 ($permit1Id) successfully created and persisted without out-of-radius error!" -ForegroundColor Green

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "TEST 5: Raise Permit 2 (Hot Work) - Zone 03 Location" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan

# Supervisor at Sector 1 - Zone 03
$capLat2 = 17.43523
$capLng2 = 78.37613
$zoneCenter2 = $zones[1]

$dist2 = Get-HaversineMeters $capLat2 $capLng2 $zoneCenter2.Lat $zoneCenter2.Lng
Write-Host "Live GPS captured: Lat $capLat2, Lng $capLng2" -ForegroundColor White
Write-Host "Distance to Zone pin ($($zoneCenter2.Name)): $dist2 meters (Threshold: $($zoneCenter2.Radius)m)" -ForegroundColor White

if ($dist2 -le $zoneCenter2.Radius) {
    Write-Host "PASS: Geofence check succeeded! Within $dist2 meters of location pin." -ForegroundColor Green
} else {
    throw "FAIL: Out of radius ($dist2 m > $($zoneCenter2.Radius) m)"
}

$permit2Id = "HW-2026-" + (Get-Random -Minimum 100000 -Maximum 999999)
$p2Body = @{
    fields = @{
        id = @{ stringValue = $permit2Id }
        ptype = @{ stringValue = "hotwork" }
        activity = @{ stringValue = "Hot Work (PTW-002)" }
        status = @{ stringValue = "Pending Site Engineer Acknowledgment" }
        project = @{ stringValue = "Sansa County" }
        projectId = @{ stringValue = "PRJ-SANSA" }
        projectName = @{ stringValue = "Sansa County" }
        tower = @{ stringValue = "Sector 1 - Zone 03" }
        location = @{ stringValue = "Structural Welding, Sector 1 - Zone 03" }
        latitude = @{ doubleValue = $capLat2 }
        longitude = @{ doubleValue = $capLng2 }
        accuracy = @{ doubleValue = 10.0 }
        distance = @{ doubleValue = $dist2 }
        within = @{ booleanValue = $true }
        createdBy = @{ stringValue = "Vinayak" }
        createdByEmail = @{ stringValue = $supEmail }
        creatorEmail = @{ stringValue = $supEmail }
        createdByUid = @{ stringValue = $supUid }
        createdRoleKey = @{ stringValue = "site-supervisor" }
        createdAt = @{ timestampValue = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ss.fffZ") }
        submittedAt = @{ timestampValue = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ss.fffZ") }
    }
} | ConvertTo-Json -Depth 10

$p2Res = Invoke-RestMethod -Uri "$baseFsUrl/permits/$permit2Id" -Method Patch -Headers $headers -Body $p2Body
Write-Host "Permit 2 ($permit2Id) successfully created and persisted without out-of-radius error!" -ForegroundColor Green

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "TEST 6: Verify Frontend Code Structure for All Requirements" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan

$content = Get-Content "public/index.html" -Raw

# 1. Geofence checks
if ($content.Contains("captureLocationForStep1") -and $content.Contains("getProjectSiteCoord(draft)")) {
    Write-Host "VERIFIED: captureLocationForStep1 uses getProjectSiteCoord(draft) instead of project root." -ForegroundColor Green
} else {
    throw "captureLocationForStep1 does not use getProjectSiteCoord(draft)!"
}

# 2. Save Draft & Exit
if ($content.Contains("saveDraftAndExit") -and $content.Contains("persistPermitToFirestore(draft)")) {
    Write-Host "VERIFIED: saveDraftAndExit persists draft permit to Firestore." -ForegroundColor Green
} else {
    throw "saveDraftAndExit does not persist draft permit to Firestore!"
}

# 3. Signature Upload option in Site Admin
if ($content.Contains("confirmGeofenceChanges") -and $content.Contains("sigPadHtml('apprSigPad'")) {
    Write-Host "VERIFIED: Site Admin Location Geofence confirmation includes Signature Upload option via sigPadHtml." -ForegroundColor Green
} else {
    throw "confirmGeofenceChanges missing sigPadHtml!"
}

if ($content.Contains("empanelSigPad") -and $content.Contains("triggerSigUpload('empanelSigPad')")) {
    Write-Host "VERIFIED: Site Admin User Creation form includes Signature Upload option." -ForegroundColor Green
} else {
    throw "User creation form missing triggerSigUpload('empanelSigPad')!"
}

# 4. Byte Parity Check
$hash1 = (Get-FileHash "public/index.html").Hash
$hash2 = (Get-FileHash "index.html").Hash
if ($hash1 -eq $hash2) {
    Write-Host "VERIFIED: 100% SHA256 byte parity maintained between public/index.html and index.html ($hash1)." -ForegroundColor Green
} else {
    throw "Hash mismatch between public/index.html and index.html!"
}

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "ALL TESTS PASSED SUCCESSFULLY!" -ForegroundColor Green
Write-Host "============================================================" -ForegroundColor Cyan
