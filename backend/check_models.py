import sys
import os
import inspect

# Ensure we can import from local directory
sys.path.insert(0, os.getcwd())

try:
    import backend.models as models
except ImportError:
    try:
        import models
    except ImportError:
        print("Could not import models")
        sys.exit(1)

print("Checking for SystemSettings model...")

if hasattr(models, 'SystemSettings'):
    print("✅ SystemSettings class found!")
    import inspect
    print(inspect.getsource(models.SystemSettings))
else:
    print("❌ SystemSettings class NOT found in models module.")
    print("Available classes:")
    for name, obj in inspect.getmembers(models):
        if inspect.isclass(obj):
            print(f" - {name}")
