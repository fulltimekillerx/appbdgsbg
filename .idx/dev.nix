
# To learn more about how to use Nix to configure your environment
# see: https://developers.google.com/idx/guides/customize-idx-env
{ pkgs, ... }: {
  # Which nixpkgs channel to use.
  channel = "stable-24.05"; # or "unstable"
  # Use https://search.nixos.org/packages to find packages
  packages = [
    pkgs.nodejs_20
    # Add Supabase CLI for interacting with your Supabase project
    pkgs.supabase-cli
  ];
  # Sets environment variables in the workspace
  env = {
    # Using secrets for Supabase credentials
    NEXT_PUBLIC_SUPABASE_URL = "$SUPABASE_URL";
    NEXT_PUBLIC_SUPABASE_ANON_KEY = "$SUPABASE_ANON_KEY"; 
  };
  idx = {
    # Search for the extensions you want on https://open-vsx.org/ and use "publisher.id"
    extensions = [
      "dbaeumer.vscode-eslint"
    ];
    # Enable previews
    previews = {
      enable = true;
      previews = {
        web = {
          command = ["npm" "run" "dev" "--" "--port" "$PORT"];
          manager = "web";
        };
      };
    };
    # Workspace lifecycle hooks
    workspace = {
      # Runs when a workspace is first created
      onCreate = {
        npm-install = "npm install";
      };
      # Runs when the workspace is (re)started
      onStart = {
        dev-server = "npm run dev";
      };
    };
  };
}
