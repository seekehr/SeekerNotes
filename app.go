package main

import (
	"SeekerNotes/internal/config"
	"SeekerNotes/internal/files"
	"context"
	"github.com/wailsapp/wails/v2/pkg/runtime"
)

// App struct
type App struct {
	ctx    context.Context
	Config *config.Config
}

// NewApp creates a new App application struct
func NewApp() *App {
	return &App{}
}

// startup is called when the app starts. The context is saved
// so we can call the runtime methods
func (a *App) startup(ctx context.Context) {
	a.ctx = ctx
	a.Config, _ = config.GetConfig() // load config once
}

// GetConfig - Returns the config if it exists. If not, create a new one and return it
func (a *App) GetConfig() (*config.Config, error) {
	return a.Config, nil
}

// SaveConfig - Overwrites config.json with current values
func (a *App) SaveConfig(conf *config.Config) error {
	return config.SaveConfig(conf)
}

func (a *App) OpenFolderDialog() (string, error) {
	return runtime.OpenDirectoryDialog(a.ctx, runtime.OpenDialogOptions{
		Title: "Select a folder",
	})
}

func (a *App) LoadSNTsFromDir(conf *config.Config) ([]*files.FileData, error) {
	return files.LoadSNTsFromDir(conf)
}

// LoadSntFileFromPath reads a .snt file from disk and returns its content. Returns in raw format
func (a *App) LoadSntFileFromPath(filePath string) (*files.FileData, error) {
	return files.LoadSntFileFromPath(filePath)
}

func (a *App) SaveFileOnDesktop(conf *config.Config, content string, fileName string) error {
	return files.SaveFileOnDesktop(conf, content, fileName)
}
