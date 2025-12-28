-- Create organization for Iron Arms Trucking
INSERT INTO organizations (name, slug)
VALUES ('Iron Arms Trucking', 'iron-arms-trucking')
ON CONFLICT (slug) DO NOTHING;

-- Create organization for KT Oliphant Properties
INSERT INTO organizations (name, slug)
VALUES ('KT Oliphant Properties', 'kt-oliphant-properties')
ON CONFLICT (slug) DO NOTHING;

-- Assign ironarmstrucking@gmail.com to their organization
UPDATE profiles 
SET organization_id = (SELECT id FROM organizations WHERE slug = 'iron-arms-trucking')
WHERE email = 'ironarmstrucking@gmail.com';

-- Set the owner of Iron Arms Trucking org
UPDATE organizations 
SET owner_id = (SELECT user_id FROM profiles WHERE email = 'ironarmstrucking@gmail.com')
WHERE slug = 'iron-arms-trucking';

-- Assign kt.oliphant08@yahoo.com to their organization
UPDATE profiles 
SET organization_id = (SELECT id FROM organizations WHERE slug = 'kt-oliphant-properties')
WHERE email = 'kt.oliphant08@yahoo.com';

-- Set the owner of KT Oliphant Properties org
UPDATE organizations 
SET owner_id = (SELECT user_id FROM profiles WHERE email = 'kt.oliphant08@yahoo.com')
WHERE slug = 'kt-oliphant-properties';

-- Update ktoliphant18@gmail.com to super_admin (landlord - sees ALL)
UPDATE user_roles 
SET role = 'super_admin' 
WHERE user_id = (SELECT user_id FROM profiles WHERE email = 'ktoliphant18@gmail.com');

-- Update ironarmstrucking@gmail.com to tenant_admin (manages their org only)
UPDATE user_roles 
SET role = 'tenant_admin' 
WHERE user_id = (SELECT user_id FROM profiles WHERE email = 'ironarmstrucking@gmail.com');

-- Update kt.oliphant08@yahoo.com to tenant_admin (manages their org only)
UPDATE user_roles 
SET role = 'tenant_admin' 
WHERE user_id = (SELECT user_id FROM profiles WHERE email = 'kt.oliphant08@yahoo.com');